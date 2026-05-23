const auraService = require('../services/auraService');

const chat = async (req, res, next) => {
  try {
    const { message } = req.body || {};

    if (typeof message !== 'string' || message.trim().length === 0) {
      const err = new Error('Field "message" is required and must be a non-empty string.');
      err.status = 400;
      throw err;
    }

    const result = await auraService.chat(message.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chat,
};
