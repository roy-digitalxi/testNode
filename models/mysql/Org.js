module.exports = (sequelize, DataTypes) => {
  const Org = sequelize.define("Org", {
    OrgID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    OrgGUID: { type: DataTypes.STRING },
    Realm: { type: DataTypes.STRING },
    OrgName: { type: DataTypes.STRING },
    OrgUrl: { type: DataTypes.STRING },
    OrgDbName: { type: DataTypes.STRING },
    OrgDbPassword: { type: DataTypes.STRING },
    IsActive: { type: DataTypes.INTEGER },
    CreatedAt: { type: DataTypes.DATE },
    UpdatedAt: { type: DataTypes.DATE }
  });

  return Org;
};
