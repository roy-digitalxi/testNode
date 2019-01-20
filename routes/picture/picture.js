// Default
import path from "path";

// Services
import ImageService from "../../services/ImageService";
import OrgService from "../../services/OrgService";

const Controller = {

  "/picture": {
    path: "/picture",
    method: "get",
    middleware: null,
    controller: async (req, res, next) => {
      let imageGUID = req.query.ImageGUID;
      let orgUrl = req.query.OrgUrl;
      let thumbSize = req.query.ThumbSize;
      if (!imageGUID) {
        return res.sendFile(
          path.join(__dirname, "../../assets/img/avatar.jpeg")
        );
      }
      if (!orgUrl) {
        return res.sendFile(
          path.join(__dirname, "../../assets/img/avatar.jpeg")
        );
      }

      try {

        const org = await OrgService.getOrgByOrgUrl(orgUrl);
        if (!org) {
          return res.sendFile(
            path.join(__dirname, "../../assets/img/avatar.jpeg")
          )
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const image = await ImageService.getImageByGUID(OrgDbName, OrgDbPassword, imageGUID);
          if (!image) {
            return res.sendFile(
              path.join(__dirname, "../../assets/img/avatar.jpeg")
            )
          } else {
            let {
              ImageType,
              ImageData,
              ImageData72X72,
              ImageData90X90,
              ImageData200X200,
              ImageData250X250,
              ImageData525X295,
              ImageData726X420
            } = image;

            let img = null;
            if (ImageData != "") {
              img = new Buffer(ImageData, "base64");
            }
            switch (thumbSize) {
              case "72X72":
                if (ImageData72X72 != "") {
                  img = new Buffer(ImageData72X72, "base64");
                }
                break;
              case "90X90":
                if (ImageData90X90 != "") {
                  img = new Buffer(ImageData90X90, "base64");
                }
                break;
              case "200X200":
                if (ImageData200X200 != "") {
                  img = new Buffer(ImageData200X200, "base64");
                }
                break;
              case "250X250":
                if (ImageData250X250 != "") {
                  img = new Buffer(ImageData250X250, "base64");
                }
                break;
              case "525X295":
                if (ImageData525X295 != "") {
                  img = new Buffer(ImageData525X295, "base64");
                }
                break;
              case "726X420":
                if (ImageData726X420 != "") {
                  img = new Buffer(ImageData726X420, "base64");
                }
                break;
              default:
                img = new Buffer(ImageData, "base64");
                break;
            }
            res.writeHead(200, {
              "Content-Type": ImageType,
              "Content-Length": img.length
            });
            res.end(img);
          }
        }
      } catch (error) {
        return res.sendFile(
          path.join(__dirname, "../../assets/img/avatar.jpeg")
        )
      }
    }
  },

}

export default Controller;
