module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define("Image", {
    ImageID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ImageGUID: { type: DataTypes.STRING },
    ImageType: { type: DataTypes.STRING },
    Height: { type: DataTypes.STRING },
    Width: { type: DataTypes.STRING },
    ImageData: { type: DataTypes.BLOB },
    ImageData72X72: { type: DataTypes.BLOB },
    ImageData90X90: { type: DataTypes.BLOB },
    ImageData200X200: { type: DataTypes.BLOB },
    ImageData250X250: { type: DataTypes.BLOB },
    ImageData525X295: { type: DataTypes.BLOB },
    ImageData726X420: { type: DataTypes.BLOB }
  });
  return Image;
};
