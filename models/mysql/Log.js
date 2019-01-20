module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define("Log", {
    LogID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Header: { type: DataTypes.STRING },
    APIKey: { type: DataTypes.STRING },
    StatusCode: { type: DataTypes.STRING },
    ElapseTime: { type: DataTypes.DOUBLE },
    Method: { type: DataTypes.STRING },
    URL: { type: DataTypes.STRING },
    Params: { type: DataTypes.STRING },
    Response: { type: DataTypes.STRING },
    Timestamp: { type: DataTypes.DATE }
  });

  return Log;
};
