const {Sequelize} = require('sequelize');
const models = require('../models/index');
const clog = require('./ChalkService');
const moment = require('moment');
exports.filterError = (error, req, res) => {
  clog.error('filterError', error);
  let return_data = {},
    http_status = 500;
  if (error !== undefined && error !== null && Object.keys(error).length != 0) {
    if (error.name !== undefined && error.name == "SequelizeValidationError") {
      //validation error
      let validattion_errors = {};
      for (let err in error.errors) {
        validattion_errors[err] = {
          message: error.errors[err].message,
          field: error.errors[err].path,
          value: error.errors[err].value,
        };
      }
      http_status = 400;
      return_data = {
        status: 0,
        message: req.__("validation_error"),
        validation_error: validattion_errors,
      };
    } else {
      return_data = {
        status: 0,
        message: req.__("exception_error"),
        error: error,
      };
    }
  } else {
    return_data = {
      status: 0,
      message: req.__("exception_error"),
      error: error,
    };
  }
  // return response;
  return res.status(http_status).json(return_data);
};

//to track all the action -> ACTION Logs=====>
exports.actionLogs = async (
  subModuleName,
  recordId,
  actionName,
  options,
  createdBy,
  req,
  res
) => {
  let date = new Date()
  let commitId = date.getTime()

  let userId = req?.user?.id
  let obj = {
    subModuleName: subModuleName,
    action: actionName,
    commit_id: commitId,
    refrence_id: recordId,
    ipAddress: req.connection.remoteAddress,
    createdBy: createdBy,
  }
  try {
    let actionTableModel = await models.table_action_logs.create(obj, {
      ...options,
      raw: true,
    })
    // console.log("actionModelTable" , actionTableModel);
    if (actionTableModel) {
      options.actionLogId = actionTableModel?.id
    }

    //return option with actionLogId
    return options
  } catch (error) {
    clog.error(error)
    return false;
  }
}

exports.genrateMasterDropdown = async (req, res, type) => {
  try {
    let options = {
      where: {
        type: type,
        deleted: 0,
      },
      order: [
        [Sequelize.literal('CASE WHEN name = "Global" THEN 0 WHEN name = "Headquarters" THEN 1 ELSE 2 END'), 'ASC'],
        ['name', 'ASC'],
      ],
    }

    const response = await models.masterDropdowns.findAll(options);

    if (response && response.length > 0) {
      return {
        status: 1,
        message: "success",
        data: response,
      };
    } else {
      return {
        status: 0,
        message: `no ${type} found`,
      };
    }

  } catch (error) {
    const return_data = this.filterError(error, req, res);
    res.json(return_data);
  }
}

exports.generateTodaysDate = () => {
  // let currentDate = new Date();
  // let day = currentDate.getUTCDate();
  // let month = currentDate.getUTCMonth() + 1; // Months are zero-indexed, so adding 1
  // let year = currentDate.getUTCFullYear();

  // let formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
  // Output the UTC date
  let NowDate = moment().utcOffset("+05:30").format('YYYY-MM-DD');
  return NowDate;
}


exports.generateUTCTimestamp = () => {
  const now = new Date();

  const year = now.getUTCFullYear();
  let month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  let day = now.getUTCDate().toString().padStart(2, '0');
  let hours = now.getUTCHours().toString().padStart(2, '0');
  let minutes = now.getUTCMinutes().toString().padStart(2, '0');
  let seconds = now.getUTCSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

exports.getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDateTime;
}


exports.searchAndSortBy = async (
  options,
  search,
  sortBy,
  orderBy,
  page,
  limit,
  model
) => {
  let sort_field = 'id',
    sort_order = 'DESC'

  let statusArray = []
  let statusObj = {}

  if (search) {
    for (const property in search) {
      if (property == 'status' && search[property]) {
        statusArray = search[property].split(',')
        statusObj = {
          status: {
            [Op.in]: statusArray,
          },
        }
        options.where[Op.or] = statusObj
      } else if (search[property] || search[property] == 0) {
        statusArray = search[property]

        options.where[property] = this.isString(statusArray)
          ? statusArray.split(',')
          : statusArray
      }
    }
  }

  if (sortBy != undefined) {
    // it,s execute when association required
    if (sortBy.toString().includes('-')) {
      let associationList = sortBy.split('-')
      let sort_field1 = associationList.pop()
      let orderObj = []
      let flag = 0
      // console.log(sort_field1);
      for (let modelName of associationList) {
        let attribute = serverSidePagination[modelName]
        // console.log(attribute);
        if (
          Array.isArray(attribute) &&
          attribute.includes(sort_field1)
        ) {
          flag = 1
        }
        orderObj.push(model[modelName])
      }

      if (flag == 0)
        return {
          status: 0,
          message: 'Attribute not found',
        }
      sort_order = orderBy ? orderBy : sort_order
      sort_field = sort_field1 ? sort_field1 : sort_field

      options.order = [orderObj.concat([sort_field, sort_order])]
    } else {
      options.order = []
      sort_field = sortBy
      sort_order = orderBy ? orderBy : sort_order
      options.order.push([sort_field, sort_order])
    }
  } else {
    sort_field = sort_field
    sort_order = sort_order
    options.order = [[sort_field, sort_order]]
  }

  if (page !== undefined && Number.isInteger(parseInt(page))) {
    limit = limit && Number.isInteger(parseInt(limit)) ? +limit : 5
    page = parseInt(page)
    page = page - 1 >= 0 ? page - 1 : 0
    options['limit'] = limit
    options['offset'] = page ? page * limit : 0
  }

  return options
}


// id exist validation
exports.validateParamsId = (id) => {
  if (id !== undefined && Number.isInteger(Number(id))) {
    return true; // Return false if the id is defined and is a valid integer
  }
  return false; // Return true if the id is undefined or not a valid integer
};



exports.ResponseMessage = async (status, message, res) => {
  return res.json({
    status: status,
    message: message
  })
}

exports.trimResponse = (data) => {
  return data.trim();
}