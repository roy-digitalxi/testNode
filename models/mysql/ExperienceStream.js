module.exports = (sequelize, DataTypes) => {
  const ExperienceStream = sequelize.define("ExperienceStream", {
    ExperienceStreamID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ExperienceStreamGUID: { type: DataTypes.STRING },
    ExperienceGUID: { type: DataTypes.STRING },
    ExperienceChannelID: { type: DataTypes.INTEGER },
    ExperienceTitle: { type: DataTypes.STRING },
    ExperienceClicks: { type: DataTypes.INTEGER },
    CreatedBy: { type: DataTypes.STRING },
    UpdatedBy: { type: DataTypes.STRING },
    CreatedAt: { type: DataTypes.DATE },
    UpdatedAt: { type: DataTypes.DATE }
  });

  return ExperienceStream;
};
