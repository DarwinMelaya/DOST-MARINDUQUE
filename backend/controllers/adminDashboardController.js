const CoralReef = require("../models/CoralReef");
const Project = require("../models/Project");
const Announcement = require("../models/Announcement");

const STATUSES = ["Healthy", "Bleached Damaged", "Recovering", "Dead"];
const PROJECT_STATUSES = ["Ongoing", "Graduated", "Terminated"];
const PROGRAM_TYPES = ["GIA", "CEST", "SSCP", "SETUP"];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDayKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function hasCoords(doc) {
  const lat = safeNumber(doc?.location?.latitude);
  const lng = safeNumber(doc?.location?.longitude);
  return lat != null && lng != null;
}

function areaPointCount(doc) {
  return Array.isArray(doc?.areaCoordinates) ? doc.areaCoordinates.length : 0;
}

function photoCount(doc) {
  if (Array.isArray(doc?.photos) && doc.photos.length > 0) return doc.photos.length;
  if (typeof doc?.photo === "string" && doc.photo.trim()) return 1;
  return 0;
}

async function getAdminDashboard(_req, res) {
  try {
    const now = new Date();
    const last7Start = new Date(now);
    last7Start.setDate(last7Start.getDate() - 6);
    const last30Start = new Date(now);
    last30Start.setDate(last30Start.getDate() - 29);

    const [
      totalCoralReefs,
      coralByStatusAgg,
      coralRecent,
      coralNeedsAttention,
      coralDailyAgg,
      coralMapRecords,
      totalProjects,
      projectByStatusAgg,
      projectByProgramTypeAgg,
      recentProjects,
      totalAnnouncements,
    ] = await Promise.all([
      CoralReef.countDocuments(),
      CoralReef.aggregate([{ $group: { _id: "$coralStatus", count: { $sum: 1 } } }]),
      CoralReef.find()
        .sort({ updatedAt: -1 })
        .limit(8)
        .select("coralName coralStatus location areaCoordinates photos photo createdAt updatedAt")
        .lean(),
      CoralReef.aggregate([
        {
          $addFields: {
            areaCount: { $size: { $ifNull: ["$areaCoordinates", []] } },
            photoCount: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$photos", []] } }, 0] },
                { $size: { $ifNull: ["$photos", []] } },
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$photo", null] },
                        { $ne: ["$photo", ""] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            $or: [
              { coralStatus: { $in: ["Bleached Damaged", "Dead"] } },
              { "location.latitude": null },
              { "location.longitude": null },
              { areaCount: { $lt: 3 } },
              { photoCount: { $eq: 0 } },
            ],
          },
        },
        { $sort: { updatedAt: -1 } },
        { $limit: 8 },
        {
          $project: {
            coralName: 1,
            coralStatus: 1,
            location: 1,
            areaCoordinates: 1,
            photos: 1,
            photo: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]),
      CoralReef.aggregate([
        { $match: { createdAt: { $gte: startOfDay(last30Start) } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),
      CoralReef.find({
        "location.latitude": { $ne: null },
        "location.longitude": { $ne: null },
      })
        .sort({ updatedAt: -1 })
        .limit(250)
        .select("coralName coralType description coralStatus location areaCoordinates photos photo")
        .lean(),
      Project.countDocuments(),
      Project.aggregate([{ $group: { _id: "$projectStatus", count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$programType", count: { $sum: 1 } } }]),
      Project.find()
        .sort({ updatedAt: -1 })
        .limit(6)
        .select("programType title beneficiary projectStatus createdAt updatedAt")
        .lean(),
      Announcement.countDocuments(),
    ]);

    const coralByStatus = STATUSES.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});
    for (const row of coralByStatusAgg) {
      const k = String(row?._id ?? "").trim();
      if (coralByStatus[k] != null) coralByStatus[k] = Number(row.count) || 0;
    }

    const projectByStatus = PROJECT_STATUSES.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});
    for (const row of projectByStatusAgg || []) {
      const k = String(row?._id ?? "").trim();
      if (projectByStatus[k] != null) projectByStatus[k] = Number(row.count) || 0;
    }

    const projectByProgramType = PROGRAM_TYPES.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});
    for (const row of projectByProgramTypeAgg || []) {
      const k = String(row?._id ?? "").trim();
      if (projectByProgramType[k] != null) projectByProgramType[k] = Number(row.count) || 0;
    }

    const dailyMap = new Map();
    for (const row of coralDailyAgg) {
      dailyMap.set(row?._id?.day, Number(row.count) || 0);
    }
    const coralCreatedDaily = [];
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(startOfDay(last30Start));
      d.setDate(d.getDate() + i);
      const key = formatDayKey(d);
      coralCreatedDaily.push({ day: key, count: dailyMap.get(key) || 0 });
    }

    const coralCreatedLast7 = coralCreatedDaily
      .slice(-7)
      .reduce((sum, x) => sum + x.count, 0);

    const coralMappedCount = await CoralReef.countDocuments({
      "location.latitude": { $ne: null },
      "location.longitude": { $ne: null },
    });

    const coralWithAreaCountAgg = await CoralReef.aggregate([
      { $addFields: { areaCount: { $size: { $ifNull: ["$areaCoordinates", []] } } } },
      { $match: { areaCount: { $gte: 3 } } },
      { $count: "count" },
    ]);
    const coralWithAreaCount = Number(coralWithAreaCountAgg?.[0]?.count || 0);

    const coralPhotosTotalAgg = await CoralReef.aggregate([
      {
        $project: {
          c: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$photos", []] } }, 0] },
              { $size: { $ifNull: ["$photos", []] } },
              {
                $cond: [
                  { $and: [{ $ne: ["$photo", null] }, { $ne: ["$photo", ""] }] },
                  1,
                  0,
                ],
              },
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$c" } } },
    ]);
    const coralPhotosTotal = Number(coralPhotosTotalAgg?.[0]?.total || 0);

    const recentActivity = (coralRecent || []).map((doc) => ({
      id: String(doc._id || ""),
      coralName: doc.coralName,
      coralStatus: doc.coralStatus,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      hasCoordinates: hasCoords(doc),
      areaPoints: areaPointCount(doc),
      photoCount: photoCount(doc),
    }));

    const needsAttention = (coralNeedsAttention || []).map((doc) => ({
      id: String(doc._id || ""),
      coralName: doc.coralName,
      coralStatus: doc.coralStatus,
      updatedAt: doc.updatedAt,
      hasCoordinates: hasCoords(doc),
      areaPoints: areaPointCount(doc),
      photoCount: photoCount(doc),
      flags: {
        criticalStatus: ["Bleached Damaged", "Dead"].includes(String(doc.coralStatus)),
        missingCoordinates: !hasCoords(doc),
        missingArea: areaPointCount(doc) < 3,
        missingPhotos: photoCount(doc) === 0,
      },
    }));

    res.json({
      generatedAt: now.toISOString(),
      kpis: {
        totalCoralReefs,
        coralMappedCount,
        coralWithAreaCount,
        coralPhotosTotal,
        coralCreatedLast7,
        totalProjects,
        totalAnnouncements,
      },
      coralByStatus,
      projectByStatus,
      projectByProgramType,
      recentProjects: (recentProjects || []).map((p) => ({
        id: String(p._id || ""),
        programType: p.programType,
        title: p.title,
        beneficiary: p.beneficiary,
        projectStatus: p.projectStatus,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      coralCreatedDaily,
      needsAttention,
      recentActivity,
      mapRecords: (coralMapRecords || []).map((doc) => ({
        id: String(doc._id || ""),
        coralName: doc.coralName,
        coralType: doc.coralType,
        description: doc.description ?? "",
        coralStatus: doc.coralStatus,
        location: doc.location ?? { latitude: null, longitude: null },
        areaCoordinates: Array.isArray(doc.areaCoordinates) ? doc.areaCoordinates : [],
        photos: Array.isArray(doc.photos) ? doc.photos : [],
        photo: typeof doc.photo === "string" ? doc.photo : "",
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load admin dashboard." });
  }
}

module.exports = { getAdminDashboard };

