import Setting from '../models/Setting.js';

// @desc    Get school branding settings
// @route   GET /api/settings
// @access  Public / Private
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        schoolName: 'SchoolSphere International Academy',
        schoolMotto: 'Excellence in Global Education • Leadership & Innovation',
        address: '100 Academic Blvd, International Education District',
        phone: '+1 (555) 019-2834',
        email: 'admissions@schoolsphere.com',
        website: 'https://schoolsphere.edu',
        academicYear: '2026-2027',
        currency: '$'
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

// @desc    Update school settings
// @route   PUT /api/settings
// @access  Private (Admin / Principal)
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'School configuration updated successfully',
      data: settings
    });
  } catch (err) {
    next(err);
  }
};
