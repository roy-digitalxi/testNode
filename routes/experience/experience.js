// Default
import middlewares from "../../middlewares";

// Libraries
import validator from "validator";

// controller
import controllers from "../../controllers";

// service
import OrgService from "../../services/OrgService";
import ExperienceStreamService from "../../services/ExperienceStreamService";

// constants
import constants from '../../constants';

// Utils
import * as helpers from "../../utilities/helpers";

const Controller = {

  "/experience/list": {
    path: "/experience/list",
    method: "post",
    middleware: [middlewares.keycloakContentViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {
      let {
        KeycloakUser: {
          realm,
        },
        Limit,
        Offset,
        Extra
      } = req.body;

      if (!Limit) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit is required" });
      }
      if (!validator.isNumeric(Limit)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit must be numeric" });
      }
      if (!Offset) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset is required" });
      }
      if (!validator.isNumeric(Offset)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset must be numeric" });
      }
      if (!Extra) {
        Extra = {};
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;
          controllers.experience.list(OrgDbName, OrgDbPassword, Limit, Offset, Extra, (error, { experiences, totalRecord }) => {
            if (error) {
              return res.json({ Confirmation: "FAIL", Message: "DB error" });
            }
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                TotalRecord: totalRecord,
                Experiences: experiences
              }
            })
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/experience/create": {
    path: "/experience/create",
    method: "post",
    middleware: [middlewares.keycloakContentCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceType,
        ExperienceTitle,
        ExperienceCard,
        ExperiencePages
      } = req.body;

      if (["0", "1"].indexOf(ExperienceType) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "Experience type is invalid, must be one of [0, 1]" });
      }
      if (!ExperienceTitle) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience title is required" });
      }
      if (ExperienceTitle.length > 255) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience title must be less than or equal 255 characters" });
      }
      if (!ExperienceCard) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience card is required" });
      }
      if (constants.EXPERIENCE_CARDS.indexOf(ExperienceCard.Type) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: `Experience card type is invalid, must be one of [${constants.EXPERIENCE_CARDS.toString()}]` });
      }
      if (ExperienceType == "1") {
        if (!ExperiencePages.length) {
          return res.status(403).json({ Confirmation: "FAIL", Message: "Experience pages is required if you don't put ExperienceType to '0'" });
        }
        const { result, message } = __validate_experience_pages(ExperiencePages);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          // 1. Create experience card
          const experienceCard = await controllers.experienceCard.create(OrgDbName, OrgDbPassword, ExperienceCard);
          if (!experienceCard) {
            return res.json({ Confirmation: "FAIL", Message: "DB error" });
          } else {

            const { ExperienceCardGUID } = experienceCard;

            if (ExperienceType == "0") {
              const experience = {
                ExperienceType,
                ExperienceTitle,
                ExperienceCard: ExperienceCardGUID,
                CreatedBy: sub
              };
              const experienceRes1 = await controllers.experience.create(OrgDbName, OrgDbPassword, experience);

              // Format XI folder
              const experienceRes2 = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, experienceRes1.ExperienceGUID);

              let tempExperience = Object.assign({}, experienceRes2);
              tempExperience = controllers.experience.getExperienceDownloadProperties(tempExperience);
              const { ExperienceDownloadProperties } = tempExperience;

              await helpers.formatXiFolder(realm, OrgDbName, OrgDbPassword, experienceRes2.ExperienceGUID, ExperienceDownloadProperties, experienceRes2);

              return res.json({
                Confirmation: "SUCCESS",
                Response: {
                  Experience: {
                    ExperienceGUID: experience.ExperienceGUID,
                    ExperienceCardGUID: ExperienceCardGUID
                  }
                }
              })

            } else {
              // 2. Create experience pages
              controllers.experiencePage.create(OrgDbName, OrgDbPassword, ExperiencePages, async (error, experiencePages) => {
                if (error) {
                  return res.json({ Confirmation: "FAIL", Message: "DB error" });
                }

                const experience = {
                  ExperienceType,
                  ExperienceTitle,
                  ExperienceCard: ExperienceCardGUID,
                  ExperiencePages: experiencePages,
                  CreatedBy: sub
                };

                const experienceRes1 = await controllers.experience.create(OrgDbName, OrgDbPassword, experience);

                // Format XI folder
                const experienceRes2 = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, experienceRes1.ExperienceGUID);

                let tempExperience = Object.assign({}, experienceRes2);
                tempExperience = controllers.experience.getExperienceDownloadProperties(tempExperience);
                const { ExperienceDownloadProperties } = tempExperience;

                const { ExperiencePages } = experienceRes2;

                let tree = controllers.experiencePage.assembleTree(ExperiencePages);
                // 1. format mobile view
                if (tree[0]) {
                  tree[0].IsContent = false;
                }
                experienceRes2.ExperiencePages = tree[0];

                await helpers.formatXiFolder(realm, OrgDbName, OrgDbPassword, experienceRes2.ExperienceGUID, ExperienceDownloadProperties, experienceRes2);

                return res.json({
                  Confirmation: "SUCCESS",
                  Response: {
                    Experience: {
                      ExperienceGUID: experienceRes2.ExperienceGUID,
                      ExperienceCardGUID: ExperienceCardGUID
                    }
                  }
                })
              })
            }
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/experience/update": {
    path: "/experience/update",
    method: "post",
    middleware: [middlewares.keycloakContentUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceGUID,
        ExperienceType,
        ExperienceTitle,
        ExperienceCard,
        ExperiencePages
      } = req.body;

      if (!ExperienceGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience guid is required" });
      }
      if (["0", "1"].indexOf(ExperienceType) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "Experience type is invalid, must be one of [0, 1]" });
      }
      if (!ExperienceTitle) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience title is required" });
      }
      if (ExperienceTitle.length > 255) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience title must be less than or equal 255 characters" });
      }
      if (!ExperienceCard) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience card is required" });
      }
      if (constants.EXPERIENCE_CARDS.indexOf(ExperienceCard.Type) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: `Experience card type is invalid, must be one of [${constants.EXPERIENCE_CARDS.toString()}]` });
      }
      if (ExperienceType == "1") {
        if (!ExperiencePages.length) {
          return res.status(403).json({ Confirmation: "FAIL", Message: "Experience pages is required if you don't put ExperienceType to '0'" });
        }
        const { result, message } = __validate_experience_pages(
          ExperiencePages
        );
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;
          const experience = await controllers.experience.findById(OrgDbName, OrgDbPassword, ExperienceGUID, false);

          if (!experience) {
            return res.json({ Confirmation: "FAIL", Message: "DB error" });
          } else {

            let experienceCardGUID = experience.ExperienceCard;
            let experiencePageGUIDs = experience.ExperiencePages;

            let updateExperienceCardGUID = ExperienceCard.ExperienceCardGUID;
            if (experienceCardGUID != updateExperienceCardGUID) {
              return res.json({ Confirmation: "FAIL", Message: "Experience card guid does not match records" });
            }

            const updatedExperienceCard = await controllers.experienceCard.update(OrgDbName, OrgDbPassword, experienceCardGUID, ExperienceCard);

            if (!updatedExperienceCard) {
              return res.json({ Confirmation: "FAIL", Message: "DB error" });
            } else {
              // 0. Update experience card
              const { ExperienceCardGUID } = updatedExperienceCard;

              let updateExperience = {
                ExperienceType,
                ExperienceTitle,
                ExperienceCard: ExperienceCardGUID,
                ExperiencePages: [],
                UpdatedBy: sub,
              };

              if (ExperienceType == "0") {

                // 1. Delete experience pages
                controllers.experiencePage.delete(OrgDbName, OrgDbPassword, experiencePageGUIDs, async (error, response) => {

                  if (error) {
                    return res.json({ Confirmation: "FAIL", Message: "DB error" });
                  }
                  // 2. Update experience
                  const updatedExperience = await controllers.experience.update(OrgDbName, OrgDbPassword, ExperienceGUID, updateExperience);

                  await ExperienceStreamService.updateExperienceStreamsByExperienceGUID(OrgDbName, OrgDbPassword, ExperienceGUID, { ExperienceTitle });

                  // Format XI folder
                  const experience = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, ExperienceGUID);

                  let tempExperience = Object.assign({}, experience);
                  tempExperience = controllers.experience.getExperienceDownloadProperties(tempExperience);
                  const { ExperienceDownloadProperties } = tempExperience;

                  await helpers.formatXiFolder(realm, OrgDbName, OrgDbPassword, experience.ExperienceGUID, ExperienceDownloadProperties, experience);

                  return res.json({
                    Confirmation: "SUCCESS",
                    Response: {
                      Experience: {
                        ExperienceGUID: updatedExperience.ExperienceGUID,
                        ExperienceCardGUID: ExperienceCardGUID
                      }
                    }
                  });
                })
              } else {

                let {
                  deletedExperiencePages,
                  updateExperiencePages,
                  newExperiencePages
                } = __split_new_update_delete_experience_pages(
                  experiencePageGUIDs,
                  ExperiencePages
                );

                // 1. Delete experience pages
                controllers.experiencePage.delete(OrgDbName, OrgDbPassword, deletedExperiencePages, (error, response) => {

                  if (error) {
                    return res.json({ Confirmation: "FAIL", Message: "DB error" });
                  }
                  // 2. Update experience pages
                  controllers.experiencePage.update(OrgDbName, OrgDbPassword, updateExperiencePages, (error, updatedExperiencePages) => {

                    if (error) {
                      return res.json({ Confirmation: "FAIL", Message: "DB error", });
                    }
                    // 3. Create experience pages
                    controllers.experiencePage.create(OrgDbName, OrgDbPassword, newExperiencePages, async (error, createdExperiencePages) => {

                      if (error) {
                        return res.json({ Confirmation: "FAIL", Message: "DB error" });
                      }

                      const experiencePages = updatedExperiencePages.concat(createdExperiencePages);
                      updateExperience.ExperiencePages = experiencePages;
                      // 4. Update experience
                      const updatedExperience = await controllers.experience.update(OrgDbName, OrgDbPassword, ExperienceGUID, updateExperience);

                      await ExperienceStreamService.updateExperienceStreamsByExperienceGUID(OrgDbName, OrgDbPassword, ExperienceGUID, { ExperienceTitle });

                      // Format XI folder
                      const experience = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, ExperienceGUID);

                      let tempExperience = Object.assign({}, experience);
                      tempExperience = controllers.experience.getExperienceDownloadProperties(tempExperience);
                      const { ExperienceDownloadProperties } = tempExperience;

                      const { ExperiencePages } = experience;
                      let tree = controllers.experiencePage.assembleTree(ExperiencePages);
                      // 1. format mobile view
                      if (tree[0]) {
                        tree[0].IsContent = false;
                      }
                      experience.ExperiencePages = tree[0];

                      await helpers.formatXiFolder(realm, OrgDbName, OrgDbPassword, experience.ExperienceGUID, ExperienceDownloadProperties, experience);

                      return res.json({
                        Confirmation: "SUCCESS",
                        Response: {
                          Experience: {
                            ExperienceGUID: updatedExperience.ExperienceGUID,
                            ExperienceCardGUID: ExperienceCardGUID
                          }
                        }
                      })
                    })
                  })
                })
              }
            }
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/experience/view": {
    path: "/experience/view",
    method: "post",
    middleware: [middlewares.keycloakContentViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ExperienceGUID
      } = req.body;

      if (!ExperienceGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "ExperienceGUID is required" });
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;
          const experience = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, ExperienceGUID);
          return res.json({
            Confirmation: "SUCCESS",
            Response: experience
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/experience/delete": {
    path: "/experience/delete",
    method: "post",
    middleware: [middlewares.keycloakContentDeleteEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ExperienceGUID
      } = req.body;

      if (!ExperienceGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "ExperienceGUID is required" });
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;
          // Format XI folder
          let experience = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, ExperienceGUID);
          experience = controllers.experience.getExperienceDownloadProperties(experience);
          const { ExperienceDownloadProperties } = experience;

          await helpers.removeXiFolder(realm, ExperienceGUID, ExperienceDownloadProperties);

          controllers.experience.delete(OrgDbName, OrgDbPassword, ExperienceGUID, async (error, response) => {
            if (error) {
              return res.json({ Confirmation: "FAIL", Message: "DB error" });
            }
            const params = {
              ExperienceGUID
            };
            await ExperienceStreamService.deleteExperienceStreamByParams(OrgDbName, OrgDbPassword, params)
            return res.json({
              Confirmation: "SUCCESS",
              Message: "Experience has been deleted"
            })
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },

  
};

const __validate_experience_pages = pages => {
  let result = true;
  let message = "";
  let hasRoot = false;

  for (let i = 0; i < pages.length; i++) {
    if (!result) {
      break;
    }

    let page = pages[i];
    const { PageGUID, IsRoot, Title, Sections } = page;

    if (hasRoot && IsRoot) {
      result = false;
      message = "Root page cannot be multiple";
      break;
    }
    if (!PageGUID) {
      result = false;
      message = "PageGUID is required";
      break;
    }
    if (!Title) {
      result = false;
      message = "Title is required";
      break;
    }
    if (IsRoot) {
      hasRoot = true;
    }

    for (let j = 0; j < Sections.length; j++) {
      // 1. mobile check: append boolean
      pages[i].Sections[j].IsCompleted = false;

      let section = Sections[j];
      const {
        SectionGUID,
        Type,
        // EDITOR
        Html,
        // BUTTON
        BtnContent,
        ConnectedPageGUID,
        // EMBED_PDF
        Pdf,
        PdfBgColor,
        // SPLASH
        SplashContent,
        SplashImg,
        SplashColor,
        SplashOpacityColor,
        SplashOpacity,
        // VIDEO
        VideoUrl,
        VideoInput,
        // IMAGE
        Img,
        ImgOpacityColor,
        ImgOpacity,
        // LINK
        Link,
        LinkInput,
        LinkLabel,
        LinkBgColor,
        // AD_BUTTON,
        AdBtnImg,
        AdBtnImgOpacityColor,
        AdBtnImgOpacity,
        AdBtnColor,
        // AD_BUTTON_2
        AdBtnBgColor,
        // H5P
        H5p,
        H5pBgColor,

        //
        Height,
        Width,
      } = section;
      if (!SectionGUID) {
        result = false;
        message = "SectionGUID is required";
        break;
      }
      if (Type == "EDITOR") {
        if (!Html) {
          result = false;
          message = "Html is required";
          break;
        }
      } else if (Type == "BUTTON") {
        // if (!BtnContent) {
        //     result = false;
        //     message = 'Btn content is required';
        //     break;
        // }
        // if (!ConnectedPageGUID) {
        //     result = false;
        //     message = 'Connected PageGUID is required';
        //     break;
        // }
      } else if (Type == "EMBED_PDF") {
        if (!Pdf) {
          result = false;
          message = "Pdf is required";
          break;
        }
        if (!PdfBgColor) {
          result = false;
          message = "Pdf bg color is required";
          break;
        }
      } else if (Type == "SPLASH") {
        if (!SplashContent) {
          result = false;
          message = "Splash content is required";
          break;
        }
        if (!SplashImg) {
          result = false;
          message = "Splash img is required";
          break;
        }
        if (!SplashColor) {
          result = false;
          message = "Splash color is required";
          break;
        }
        if (!SplashOpacityColor) {
          result = false;
          message = "Splash opacity color is required";
          break;
        }
        if (!SplashOpacity) {
          result = false;
          message = "Splash opacity is required";
          break;
        }
      } else if (Type == "VIDEO") {
        if (!VideoUrl) {
          result = false;
          message = "Video url is required";
          break;
        }
      } else if (Type == "IMAGE") {
        if (!Img) {
          result = false;
          message = "Img is required";
          break;
        }
        if (!ImgOpacityColor) {
          result = false;
          message = "Img opacity color is required";
          break;
        }
        if (!ImgOpacity) {
          result = false;
          message = "Img opacity is required";
          break;
        }
      } else if (Type == "LINK") {
        if (!Link) {
          result = false;
          message = "Link is required";
          break;
        }
        if (!LinkBgColor) {
          result = false;
          message = "Link bg color is required";
          break;
        }
      } else if (Type == "AD_BUTTON") {
        if (!AdBtnImg) {
          result = false;
          message = "Ad btn img is required";
          break;
        }
        if (!AdBtnImgOpacityColor) {
          result = false;
          message = "Ad btn img opacity color is required";
          break;
        }
        if (!AdBtnImgOpacity) {
          result = false;
          message = "Ad btn img opacity is required";
          break;
        }
        if (!AdBtnColor) {
          result = false;
          message = "Ad btn color is required";
          break;
        }
      } else if (Type == "AD_BUTTON_2") {
        if (!AdBtnBgColor) {
          result = false;
          message = "Ad btn bg color is required";
          break;
        }
        if (!AdBtnColor) {
          result = false;
          message = "Ad btn color is required";
          break;
        }
      } else if (Type == "H5P") {
        if (!H5p) {
          result = false;
          message = "H5p is required";
          break;
        }
        if (!H5pBgColor) {
          result = false;
          message = "H5p bg color is required";
          break;
        }
      } else {
        result = false;
        message = "Invalid section type";
        break;
      }
    }
  }
  if (!hasRoot) {
    result = false;
    message = message ? message : "Root page is required";
  }
  return {
    result,
    message
  };
};

const __split_new_update_delete_experience_pages = (
  experiencePageGUIDs,
  experiencePages
) => {
  let deletedExperiencePages = [];
  let updateExperiencePages = [];
  let newExperiencePages = [];
  for (let i = 0; i < experiencePages.length; i++) {
    let experiencePage = experiencePages[i];
    if (experiencePage.ExperiencePageGUID) {
      updateExperiencePages.push(experiencePage);
    } else {
      newExperiencePages.push(experiencePage);
    }
  }
  for (let i = 0; i < experiencePageGUIDs.length; i++) {
    let experiencePageGUID = experiencePageGUIDs[i];
    let match = false;
    for (let j = 0; j < updateExperiencePages.length; j++) {
      let updateExperiencePage = updateExperiencePages[j];
      if (experiencePageGUID == updateExperiencePage.ExperiencePageGUID) {
        match = true;
      }
    }
    if (!match) {
      deletedExperiencePages.push(experiencePageGUID);
    }
  }
  return {
    deletedExperiencePages,
    updateExperiencePages,
    newExperiencePages
  };
};

export default Controller;
