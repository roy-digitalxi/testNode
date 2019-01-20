module.exports = (sequelize, DataTypes) => {
  const ExperienceChannel = sequelize.define("ExperienceChannel", {
    ExperienceChannelID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ExperienceChannelGUID: { type: DataTypes.STRING },
    ChannelName: { type: DataTypes.STRING },
    ChannelDescription: { type: DataTypes.STRING },
    ChannelColor: { type: DataTypes.STRING },
    ChannelStatus: { type: DataTypes.STRING },
    ChannelType: { type: DataTypes.STRING },
    ChannelCode: { type: DataTypes.STRING },
    ChannelLanguageGUID: { type: DataTypes.STRING },
    IsDeleted: { type: DataTypes.INTEGER },
    CreatedBy: { type: DataTypes.STRING },
    UpdatedBy: { type: DataTypes.STRING },
    CreatedAt: { type: DataTypes.DATE },
    UpdatedAt: { type: DataTypes.DATE }
  });

  return ExperienceChannel;
};
