module.exports = (sequelize, DataTypes) => {
  const ChannelSubscribe = sequelize.define("ChannelSubscribe", {
    ChannelSubscribeID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ChannelSubscribeGUID: { type: DataTypes.STRING },
    UserGUID: { type: DataTypes.STRING },
    ExperienceChannelID: { type: DataTypes.INTEGER },
    IsHardInterest: { type: DataTypes.INTEGER },
    IsDeleted: { type: DataTypes.INTEGER },
    CreatedAt: { type: DataTypes.DATE },
    UpdatedAt: { type: DataTypes.DATE }
  });

  return ChannelSubscribe;
};
