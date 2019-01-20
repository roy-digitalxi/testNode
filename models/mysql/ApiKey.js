module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define("ApiKey", {
    KeyID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    KeyGUID: { type: DataTypes.STRING },
    Level: { type: DataTypes.INTEGER },
    IsActive: { type: DataTypes.INTEGER },
    Note: { type: DataTypes.STRING },
    IsActivePasscode: { type: DataTypes.INTEGER },
    Version: { type: DataTypes.STRING },
    CreatedAt: { type: DataTypes.DATE },
    UpdatedAt: { type: DataTypes.DATE }
  });

  return ApiKey;
};
