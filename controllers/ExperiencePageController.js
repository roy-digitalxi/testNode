// Libraries
import Promise from "bluebird";
import mongoose from 'mongoose';

// helpers
import * as helpers from "../utilities/helpers";

// Model
import ExperiencePage from "../models/mongodb/ExperiencePage";

const connectDB = (dbName, dbPassword) => {
  const dbUserName = dbName;
  return mongoose.createConnection(`mongodb://${dbUserName}:${dbPassword}@localhost/${dbName}`);
}

export default {

  create: (dbName, dbPassword, pages, callback) => {

    const connection = connectDB(dbName, dbPassword);
    const experiencePageSchema = connection.model('ExperiencePageSchema', ExperiencePage.ExperiencePageSchema);

    let tasks = [];
    for (let i = 0; i < pages.length; i++) {
      let task = new Promise((resolve, reject) => {
        let experiencePage = pages[i];
        experiencePageSchema.create(experiencePage, (error, experiencePage) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(experiencePage._id);
          return;
        }
        );
      });
      tasks.push(task);
    }
    Promise.all(tasks)
      .then(response => {
        connection.close();
        callback(null, response);
      })
      .catch(error => {
        connection.close();
        callback(error, null);
      });
  },

  update: (dbName, dbPassword, pages, callback) => {

    const connection = connectDB(dbName, dbPassword);
    const experiencePageSchema = connection.model('ExperiencePageSchema', ExperiencePage.ExperiencePageSchema);

    let tasks = [];
    for (let i = 0; i < pages.length; i++) {
      let task = new Promise((resolve, reject) => {
        let experiencePage = pages[i];
        experiencePage.UpdatedAt = helpers.currentDatetime();
        experiencePageSchema.findByIdAndUpdate(experiencePage.ExperiencePageGUID, experiencePage, (error, experiencePage) => {
          if (error) {
            reject(error);
            return;
          }
          if (!experiencePage) {
            reject("Experience page not found");
            return;
          }
          resolve(experiencePage._id);
          return;
        }
        );
      });
      tasks.push(task);
    }
    Promise.all(tasks)
      .then(response => {
        connection.close();
        callback(null, response);
      })
      .catch(error => {
        connection.close();
        callback(error, null);
      });
  },

  delete: (dbName, dbPassword, experiencePages, callback) => {

    const connection = connectDB(dbName, dbPassword);
    const experiencePageSchema = connection.model('ExperiencePageSchema', ExperiencePage.ExperiencePageSchema);

    let tasks = [];
    for (let i = 0; i < experiencePages.length; i++) {
      let task = new Promise((resolve, reject) => {
        let experiencePageGUID = experiencePages[i];
        experiencePageSchema.findByIdAndRemove(
          experiencePageGUID,
          error => {
            if (error) {
              reject(error);
              return;
            }
            resolve(null);
            return;
          }
        );
      });
      tasks.push(task);
    }
    Promise.all(tasks)
      .then(response => {
        connection.close();
        callback(null, response);
      })
      .catch(error => {
        connection.close();
        callback(error, null);
      });
  },

  find: (dbName, dbPassword, params, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experiencePageSchema = connection.model('ExperiencePageSchema', ExperiencePage.ExperiencePageSchema);

      experiencePageSchema.find(params, (error, experiencePages) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (isRaw) {
          resolve(experiencePages);
          return;
        }
        let summaries = [];
        experiencePages.forEach(experiencePage => {
          summaries.push(experiencePage.summary());
        });
        resolve(summaries);
        return;
      });
    });
  },

  findById: (dbName, dbPassword, experiencePageGUID, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experiencePageSchema = connection.model('ExperiencePageSchema', ExperiencePage.ExperiencePageSchema);

      experiencePageSchema.findById(experiencePageGUID, (error, experiencePage) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (!experiencePage) {
          reject("Experience page not found");
          return;
        }
        if (isRaw) {
          resolve(experiencePage);
          return;
        }
        resolve(experiencePage.summary());
        return;
      });
    });
  },

  assembleTree: experiencePages => {
    // Format pages
    __format_pages(experiencePages);
    // Root page arrange to begin
    __arrange_root_page(experiencePages);
    // Treeify pages
    let tree = __treeify(experiencePages);
    return tree;
  }
};

const __format_pages = pages => {
  for (let i = 0; i < pages.length; i++) {
    let page = pages[i];

    // 1. format mobile view
    for (let j = 0; j < page.Sections.length; j++) {
      pages[i].Sections[j].IsContent = true;
    }
    if (page.IsSplash) {
      for (let j = 0; j < page.Sections.length; j++) {
        let section = page.Sections[j];
        if (section.Type == "SPLASH") {
          page.SplashImg = section.SplashImg;
          page.SplashHeight = section.Height;
          page.SplashWidth = section.Width;
          page.SplashContent = section.SplashContent;
          page.SplashColor = section.SplashColor;
          page.SplashOpacityColor = section.SplashOpacityColor;
          page.SplashOpacity = section.SplashOpacity;
          pages[i].Sections.splice(j, 1);
          break;
        }
      }
    }
  }
};

const __arrange_root_page = pages => {
  let rootPage, rootIndex;
  for (let i = 0; i < pages.length; i++) {
    let page = pages[i];
    if (page.IsRoot) {
      rootPage = page;
      rootIndex = i;
    }
  }
  if (rootPage) {
    pages.splice(rootIndex, 1);
    pages.unshift(rootPage);
  }
};

const __treeify = (list, idAttr, parentAttr, childrenAttr) => {
  // flat array to tree structure
  if (!idAttr) idAttr = "PageGUID";
  if (!parentAttr) parentAttr = "ParentPageGUID";
  if (!childrenAttr) childrenAttr = "Sections";
  let treeList = [];
  let lookup = {};
  list.forEach(obj => {
    lookup[obj[idAttr]] = obj;
  });
  list.forEach(obj => {
    if (obj[parentAttr] != null) {
      // replace button connector with page
      let index = __find_index_of_sections(
        lookup[obj[parentAttr]][childrenAttr],
        obj
      );
      obj.IsContent = false;
      obj.SectionGUID = lookup[obj[parentAttr]][childrenAttr][index].SectionGUID;
      obj.Type = lookup[obj[parentAttr]][childrenAttr][index].Type;
      obj.BtnContent = lookup[obj[parentAttr]][childrenAttr][index].BtnContent;
      obj.AdBtnColor = lookup[obj[parentAttr]][childrenAttr][index].AdBtnColor;
      obj.AdBtnImg = lookup[obj[parentAttr]][childrenAttr][index].AdBtnImg;
      obj.AdBtnHeight = lookup[obj[parentAttr]][childrenAttr][index].Height;
      obj.AdBtnWidth = lookup[obj[parentAttr]][childrenAttr][index].Width;
      obj.AdBtnImgOpacityColor = lookup[obj[parentAttr]][childrenAttr][index].AdBtnImgOpacityColor;
      obj.AdBtnImgOpacity = lookup[obj[parentAttr]][childrenAttr][index].AdBtnImgOpacity;
      obj.AdBtnBgColor = lookup[obj[parentAttr]][childrenAttr][index].AdBtnBgColor;
      lookup[obj[parentAttr]][childrenAttr].splice(index, 1);
      lookup[obj[parentAttr]][childrenAttr].splice(index, 0, obj);
    } else {
      treeList.push(obj);
    }
  });
  return treeList;
};

const __find_index_of_sections = (sections, page) => {
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].ConnectedPageGUID == page.PageGUID) {
      return i;
    }
  }
  return 0;
};
