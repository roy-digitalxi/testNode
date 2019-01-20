// Default
import middlewares from "../../middlewares";

// services
import OrgService from "../../services/OrgService";
import ExperienceChannelService from "../../services/ExperienceChannelService";

// controller
import controllers from "../../controllers";

// Libraries
import validator from "validator";

const Controller = {

  "/language/list": {
    path: "/language/list",
    method: "post",
    middleware: [middlewares.keycloakLanguageViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
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
          const languagesResponse = await controllers.language.list(OrgDbName, OrgDbPassword, Limit, Offset, Extra);
          if (languagesResponse) {
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                Languages: languagesResponse
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/language/create": {
    path: "/language/create",
    method: "post",
    middleware: [middlewares.keycloakLanguageCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        Language,
        LanguageCode,
        LoginScreen,
        HomeScreen,
        ExploreScreen,
        FeedScreen,
        BookmarkScreen,
        DownloadScreen,
        SectionScreen,
        FeedbackScreen,
        LanguageScreen,
        Loader,
        DxCard,
        DxModal,
        SideBar,
        Message,
        FirstInstall,
      } = req.body;

      if (!Language) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language is required" });
      }
      if (!LanguageCode) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language code is required" });
      }
      if (LoginScreen) {
        const { result, message } = __validate_screen_labels(LoginScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (HomeScreen) {
        const { result, message } = __validate_screen_labels(HomeScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (ExploreScreen) {
        const { result, message } = __validate_screen_labels(ExploreScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (FeedScreen) {
        const { result, message } = __validate_screen_labels(FeedScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (BookmarkScreen) {
        const { result, message } = __validate_screen_labels(BookmarkScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (DownloadScreen) {
        const { result, message } = __validate_screen_labels(DownloadScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (SectionScreen) {
        const { result, message } = __validate_screen_labels(SectionScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (FeedbackScreen) {
        const { result, message } = __validate_screen_labels(FeedbackScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (LanguageScreen) {
        const { result, message } = __validate_screen_labels(LanguageScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (Loader) {
        const { result, message } = __validate_screen_labels(Loader);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (DxCard) {
        const { result, message } = __validate_screen_labels(DxCard);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (DxModal) {
        const { result, message } = __validate_screen_labels(DxModal);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (SideBar) {
        const { result, message } = __validate_screen_labels(SideBar);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (Message) {
        const { result, message } = __validate_screen_labels(Message);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (FirstInstall) {
        const { result, message } = __validate_screen_labels(FirstInstall);
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

          let loginLabels, homeLabels, exploreLabels, feedLabels, bookmarkLabels, downloadLabels, sectionLabels, feedbackLabels, languageLabels, loaderLabels, dxCardLabels, dxModalLabels, sideBarLabels, messageLabels, firstInstallLabels;
          if (LoginScreen) {
            loginLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, LoginScreen);
          }
          if (HomeScreen) {
            homeLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, HomeScreen);
          }
          if (ExploreScreen) {
            exploreLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, ExploreScreen);
          }
          if (FeedScreen) {
            feedLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, FeedScreen);
          }
          if (BookmarkScreen) {
            bookmarkLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, BookmarkScreen);
          }
          if (DownloadScreen) {
            downloadLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, DownloadScreen);
          }
          if (SectionScreen) {
            sectionLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, SectionScreen);
          }
          if (FeedbackScreen) {
            feedbackLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, FeedbackScreen);
          }
          if (LanguageScreen) {
            languageLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, LanguageScreen);
          }
          if (Loader) {
            loaderLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, Loader);
          }
          if (DxCard) {
            dxCardLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, DxCard);
          }
          if (DxModal) {
            dxModalLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, DxModal);
          }
          if (SideBar) {
            sideBarLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, SideBar);
          }
          if (Message) {
            messageLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, Message);
          }
          if (FirstInstall) {
            firstInstallLabels = await controllers.languageLabel.create(OrgDbName, OrgDbPassword, FirstInstall);
          }

          // existing list
          const languages = await controllers.language.find(OrgDbName, OrgDbPassword, {}, false);
          const isFirstLanguage = !languages.length;

          const language = {
            Language,
            LanguageCode,
            LoginScreen: loginLabels ? loginLabels : [],
            HomeScreen: homeLabels ? homeLabels : [],
            ExploreScreen: exploreLabels ? exploreLabels : [],
            FeedScreen: feedLabels ? feedLabels : [],
            BookmarkScreen: bookmarkLabels ? bookmarkLabels : [],
            DownloadScreen: downloadLabels ? downloadLabels : [],
            SectionScreen: sectionLabels ? sectionLabels : [],
            FeedbackScreen: feedbackLabels ? feedbackLabels : [],
            LanguageScreen: languageLabels ? languageLabels : [],
            Loader: loaderLabels ? loaderLabels : [],
            DxCard: dxCardLabels ? dxCardLabels : [],
            DxModal: dxModalLabels ? dxModalLabels : [],
            SideBar: sideBarLabels ? sideBarLabels : [],
            Message: messageLabels ? messageLabels : [],
            FirstInstall: firstInstallLabels ? firstInstallLabels : [],
            IsDefault: isFirstLanguage,
            CreatedBy: sub,
          };
          const languageResponse = await controllers.language.create(OrgDbName, OrgDbPassword, language);
          if (languageResponse) {

            if (isFirstLanguage) {
              await ExperienceChannelService.formatExperienceChannelLanguage(OrgDbName, OrgDbPassword, languageResponse.LanguageGUID, sub);
            }

            // auto create general channel under language
            let experienceChannel = {
              ChannelName: `General - ${Language}`,
              ChannelDescription: `Auto generated by system`,
              ChannelColor: '#000000',
              ChannelType: '3',
              ChannelStatus: 'LIVE',
              ChannelLanguageGUID: languageResponse.LanguageGUID,
              CreatedBy: sub,
            };

            await ExperienceChannelService.createExperienceChannel(OrgDbName, OrgDbPassword, experienceChannel);

            return res.json({
              Confirmation: "SUCCESS",
              Message: 'Language has been created'
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/language/update": {
    path: "/language/update",
    method: "post",
    middleware: [middlewares.keycloakLanguageUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        LanguageGUID,
        Language,
        LanguageCode,
        LoginScreen,
        HomeScreen,
        ExploreScreen,
        FeedScreen,
        BookmarkScreen,
        DownloadScreen,
        SectionScreen,
        FeedbackScreen,
        LanguageScreen,
        Loader,
        DxCard,
        DxModal,
        SideBar,
        Message,
        FirstInstall,
      } = req.body;

      if (!LanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language guid is required" });
      }
      if (!Language) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language is required" });
      }
      if (!LanguageCode) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language code is required" });
      }
      if (LoginScreen) {
        const { result, message } = __validate_screen_labels(LoginScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (HomeScreen) {
        const { result, message } = __validate_screen_labels(HomeScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (ExploreScreen) {
        const { result, message } = __validate_screen_labels(ExploreScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (FeedScreen) {
        const { result, message } = __validate_screen_labels(FeedScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (BookmarkScreen) {
        const { result, message } = __validate_screen_labels(BookmarkScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (DownloadScreen) {
        const { result, message } = __validate_screen_labels(DownloadScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (SectionScreen) {
        const { result, message } = __validate_screen_labels(SectionScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (FeedbackScreen) {
        const { result, message } = __validate_screen_labels(FeedbackScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (LanguageScreen) {
        const { result, message } = __validate_screen_labels(LanguageScreen);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (Loader) {
        const { result, message } = __validate_screen_labels(Loader);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (DxCard) {
        const { result, message } = __validate_screen_labels(DxCard);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (DxModal) {
        const { result, message } = __validate_screen_labels(DxModal);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (SideBar) {
        const { result, message } = __validate_screen_labels(SideBar);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (Message) {
        const { result, message } = __validate_screen_labels(Message);
        if (!result) {
          return res.status(403).json({ Confirmation: "FAIL", Message: message });
        }
      }
      if (FirstInstall) {
        const { result, message } = __validate_screen_labels(FirstInstall);
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

          let loginLabels, homeLabels, exploreLabels, feedLabels, bookmarkLabels, downloadLabels, sectionLabels, feedbackLabels, languageLabels, loaderLabels, dxCardLabels, dxModalLabels, sideBarLabels, messageLabels, firstInstallLabels;
          if (LoginScreen) {
            loginLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, LoginScreen);
          }
          if (HomeScreen) {
            homeLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, HomeScreen);
          }
          if (ExploreScreen) {
            exploreLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, ExploreScreen);
          }
          if (FeedScreen) {
            feedLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, FeedScreen);
          }
          if (BookmarkScreen) {
            bookmarkLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, BookmarkScreen);
          }
          if (DownloadScreen) {
            downloadLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, DownloadScreen);
          }
          if (SectionScreen) {
            sectionLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, SectionScreen);
          }
          if (FeedbackScreen) {
            feedbackLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, FeedbackScreen);
          }
          if (LanguageScreen) {
            languageLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, LanguageScreen);
          }
          if (Loader) {
            loaderLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, Loader);
          }
          if (DxCard) {
            dxCardLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, DxCard);
          }
          if (DxModal) {
            dxModalLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, DxModal);
          }
          if (SideBar) {
            sideBarLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, SideBar);
          }
          if (Message) {
            messageLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, Message);
          }
          if (FirstInstall) {
            firstInstallLabels = await controllers.languageLabel.update(OrgDbName, OrgDbPassword, FirstInstall);
          }

          const language = {
            Language,
            LanguageCode,
            LoginScreen: loginLabels ? loginLabels : [],
            HomeScreen: homeLabels ? homeLabels : [],
            ExploreScreen: exploreLabels ? exploreLabels : [],
            FeedScreen: feedLabels ? feedLabels : [],
            BookmarkScreen: bookmarkLabels ? bookmarkLabels : [],
            DownloadScreen: downloadLabels ? downloadLabels : [],
            SectionScreen: sectionLabels ? sectionLabels : [],
            FeedbackScreen: feedbackLabels ? feedbackLabels : [],
            LanguageScreen: languageLabels ? languageLabels : [],
            Loader: loaderLabels ? loaderLabels : [],
            DxCard: dxCardLabels ? dxCardLabels : [],
            DxModal: dxModalLabels ? dxModalLabels : [],
            SideBar: sideBarLabels ? sideBarLabels : [],
            Message: messageLabels ? messageLabels : [],
            FirstInstall: firstInstallLabels ? firstInstallLabels : [],
            UpdatedBy: sub
          };

          const languageResponse = await controllers.language.update(OrgDbName, OrgDbPassword, LanguageGUID, language);
          if (languageResponse) {
            return res.json({
              Confirmation: "SUCCESS",
              Message: 'Language has been updated'
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/language/update_default": {
    path: "/language/update_default",
    method: "post",
    middleware: [middlewares.keycloakLanguageUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        LanguageGUID,
      } = req.body;

      if (!LanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language guid is required" });
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

          let language = await controllers.language.findById(OrgDbName, OrgDbPassword, LanguageGUID, false);
          if (language) {
            let updatedResponse = await controllers.language.updateDefaultLanguage(OrgDbName, OrgDbPassword, LanguageGUID, sub);
            if (updatedResponse) {
              return res.json({
                Confirmation: "SUCCESS",
                Message: 'Default Language has been updated'
              })
            }
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/language/update_status": {
    path: "/language/update_status",
    method: "post",
    middleware: [middlewares.keycloakLanguageViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        LanguageGUID,
        Status
      } = req.body;

      if (!LanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language guid is required" });
      }
      if (!Status) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Status is required" });
      }
      if (["0", "1"].indexOf(Status) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "Status is invalid, must be one of [0, 1]" });
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

          // 1. check at least one active language
          const activeLanguages = await controllers.language.find(OrgDbName, OrgDbPassword, { IsActive: true }, false);

          if (activeLanguages.length == 1 && Status == '0') {
            return res.json({ Confirmation: "FAIL", Message: "At least one active language" });
          }

          // 2. update language status
          let language = await controllers.language.findById(OrgDbName, OrgDbPassword, LanguageGUID, false);

          if (language.IsDefault && Status == '0') {
            return res.json({ Confirmation: "FAIL", Message: "Please change the default language before update the status" });
          }

          language.IsActive = Status === '0' ? false : true;
          language.UpdatedBy = sub;

          let updatedLanguage = await controllers.language.update(OrgDbName, OrgDbPassword, LanguageGUID, language);
          if (updatedLanguage) {
            return res.json({
              Confirmation: "SUCCESS",
              Message: 'Language status has been updated'
            });
          }
        }

      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/language/view": {
    path: "/language/view",
    method: "post",
    middleware: [middlewares.keycloakLanguageViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm
        },
        LanguageGUID,
      } = req.body;
      if (!LanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language guid is required" });
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

          const languageResponse = await controllers.language.viewLanguageDetail(OrgDbName, OrgDbPassword, LanguageGUID);
          if (languageResponse) {
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                Language: languageResponse
              }
            });
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


};

export default Controller;


const __validate_screen_labels = screen => {
  let output = {
    result: true,
    message: "",
  }

  if (!Array.isArray(screen)) {
    output.result = false;
    output.message = "Screen labels must be a array";
    return output;
  }
  if (!screen.length) {
    output.result = false;
    output.message = "Screen labels cannot be empty";
    return output;
  }

  screen.map((label) => {
    if (!label.Type) {
      output.result = false;
      output.message = "Screen label type is required";
      return output;
    } else if (!label.Content) {
      output.result = false;
      output.message = "Screen label content is required";
      return output;
    }
  })

  return output;
};