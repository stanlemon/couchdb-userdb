const axios = require("axios");

module.exports = function checkStatus(url) {
    return axios.get(url, {
          timeout: 100,
    })
        .then((response) => {
            if (response && response.data && response.data.uuid) {
                return response;
            }
            return false;
        })
        .catch((error) => {
            return false;
        })
}
