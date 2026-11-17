import Notice from '../models/Notice.js';

// @desc    Get all notices / events / gallery
// @route   GET /api/notices
// @access  Private
export const getAllNotices = async (req, res, next) => {
  try {
    const { type, search, publishedOnly } = req.query;
    const query = {};

    if (type) query.type = type;
    if (publishedOnly === 'true' || ['student', 'parent'].includes(req.user.role)) {
      query.isPublished = true;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single notice
// @route   GET /api/notices/:id
// @access  Private
export const getNoticeById = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy', 'name role');
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.status(200).json({ success: true, data: notice });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new notice/event/gallery item
// @route   POST /api/notices
// @access  Private (Admin / Principal / Teacher)
export const createNotice = async (req, res, next) => {
  try {
    const { type, title, description, imageUrl, eventDate, targetRole, isPublished } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const notice = await Notice.create({
      type: type || 'Notice',
      title,
      description: description || '',
      imageUrl: imageUrl || '',
      eventDate: eventDate || null,
      targetRole: targetRole || 'all',
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Notice posted successfully', data: notice });
  } catch (err) {
    next(err);
  }
};

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private (Admin / Principal / Teacher)
export const updateNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.status(200).json({ success: true, message: 'Notice updated', data: notice });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin / Principal)
export const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    next(err);
  }
};
