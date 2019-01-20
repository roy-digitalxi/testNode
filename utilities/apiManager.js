import axios from "axios";
import request from "request";
import Promise from "bluebird";
import * as helpers from "./helpers";

export const get = (endpoint, params) => {
  return new Promise(function (resolve, reject) {
    axios
      .get(endpoint, params)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const post = (endpoint, params, headers) => {
  return new Promise(function (resolve, reject) {
    axios
      .post(endpoint, params, headers)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const xml = (endpoint, xml, isCert) => {
  return new Promise((resolve, reject) => {
    let options = {
      method: "POST",
      keepAlive: false,
      url: endpoint,
      headers: {
        "Content-Type": "text/xml"
      },
      body: xml
    };
    request(options, function (error, response, body) {
      if (error) {
        reject(error);
        return;
      }
      helpers
        .parseXMLToObject(body)
        .then(response => {
          resolve(response);
          return;
        })
        .catch(error => {
          reject(error);
          return;
        });
    });
  });
};

export const lrsPost = (endpoint, params, headers) => {
  return new Promise(function (resolve, reject) {
    axios
      .create({
        headers,
      })
      .post(endpoint, params)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
  });
};