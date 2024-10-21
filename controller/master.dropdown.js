const models = require("../models/index");
const CommonService = require('../services/CommonService')

exports.getAllUserSkills = async (req, res) => {
    try {

        const getSkillsData = await CommonService.genrateMasterDropdown(req, res, "skill");
        if (getSkillsData.data && getSkillsData.data.length > 0) {
            res.send({
                status: 1,
                message: "success",
                data: getSkillsData.data,
            });
        } else {
            res.send({
                status: 0,
                message: "no skill found",
            });
        }
    } catch (error) {
        await CommonService.filterError(error, req, res);
    }
}

exports.getAllUserInterest = async (req, res) => {
    try {
        const getInterestData = await CommonService.genrateMasterDropdown(req, res, "interest");
        if (getInterestData.data && getInterestData.data.length > 0) {
            return res.send({
                status: 1,
                message: "success",
                data: getInterestData.data,
            });
        } else {
            return res.send({
                status: 0,
                message: "no interest found",
            });
        }
    } catch (error) {
        await CommonService.filterError(error, req, res);
    }
}

exports.getAllLocationList = async (req, res) => {
    try {
        const getLocationData = await CommonService.genrateMasterDropdown(req, res, "location");
        if (getLocationData.data && getLocationData.data.length > 0) {
            return res.send({
                status: 1,
                message: "success",
                data: getLocationData.data,
            });
        } else {
            return res.send({
                status: 0,
                message: "no location found",
            });
        }
    } catch (error) {
        await CommonService.filterError(error, req, res);
    }
}