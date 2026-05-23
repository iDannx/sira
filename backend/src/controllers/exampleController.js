const getExample = (req, res, next) => {
  try {
    res.json({
      message: 'Hello from the SIRA backend',
      data: {
        id: 1,
        name: 'example',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExample,
};
