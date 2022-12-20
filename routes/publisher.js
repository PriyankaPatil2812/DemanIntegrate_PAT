/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/
/*@author somnath keswad
 * Desc Allocate the campaign from database on allocate campaign to publisher page
 @version 1.0
 */
 var express = require("express");
 var router = express.Router();
 const validateLoginInput = require('../validation/login');
 var dateTime = require("node-datetime");
 const isEmpty = require('../validation/is-empty');
 let email = require('./emailSend');
 //for properties file
 var PropertiesReader = require('properties-reader');
 var properties = PropertiesReader('./status/leadStatus.file');
 var propertiesNotification = PropertiesReader('./status/alertsNotification.file');
 //Sonali-3257-added this PropertiesReader to add details in campaign log to trace details
 var campaignTraceProperties=PropertiesReader('./status/campaignTraceReportDetails.file');
 url = require("url");
 var Archiver = require("archiver");
 var zip = require('adm-zip');
 var dt = dateTime.create();
 var formatted = dt.format("Y-m-d H:M:S");
 var JSZip = require("jszip");
 const xlsx = require('xlsx');
 const text = require('pdf-stream').text;
 const PDFDocumentCreate = require('pdfkit');
 var pool = require('./database/database');
 var log = require('../configuration/logger').LOG;
 //const CountryCodes = require('country-code-info');
 var countries = require('country-data').countries;
 var PdfTable = require('voilab-pdf-table');
 const Excel = require('exceljs');
 // const crypto = require('crypto');
 // const algorithm = 'aes-256-cbc';
 const Cryptr = require('cryptr');
 var encryptSecretKey = properties.get('encryption.secretKey')
 const cryptr = new Cryptr(encryptSecretKey);
 var errors;
 const GenerateIO = require('./invoice');
 const authCheck=require('./check_auth')//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
 var emailConfigYes = properties.get('emailConfig.yes');
 var randomstring = require("randomstring")//Sonali-3519-added to generrate random IO number 
 //file uploadingin
 // const multer = require('multer');
 // const uuidv4 = require('uuid/v4');
 const path = require('path');
 // const storage = multer.diskStorage({
 //   destination: (req, file, cb) => {
 
 //     cb(null, './public/upload');
 //   },
 //   filename: (req, file, cb) => {
 //     const newFilename = `${uuidv4()}${path.extname(file.originalname)}`;
 //     cb(null, newFilename);
 //   },
 // });
 // // create the multer instance that will be used to upload/save the file
 // const upload = multer({ storage });
 
 /**
  * @author Narendra Phadke
  * @param  Description Use for Json to Excel conversation
  */
 
 var json2xls = require("json2xls");
 const fs = require("fs");
 var stream = require("stream");
 //  var excel=require("xlsx");
 var readXlsxFile = require("read-excel-file/node");
 var readExcel = require("read-excel-file");
 var xlsxtojson = require("xlsx-to-json-lc");
 var formData = require("form-data");
 var reader = require('filereader');
 var Blob = require('blob');
 var FileSaver = require('file-saver');
 const ObjectsToCsv = require('objects-to-csv');
 const download = require('download');
 
 //Supriya Task:3075 - get uploadLead page to use common function to download lead
 const uploadLeadFunction = require('./leadModule/uploadLead');
 
 
 /**
        * @author Supriya Gore
        * @param  Description handle the No GDPR Compliance
        * @return Description return All details of Not GDPR compliance for pending allocation
        */
 router.post("/assignNoGDPRPublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside assignNoGDPRPublisher");
 
   var errors;
   var campID = req.body.campID;
   var agencyID = req.token.id;
   var approve = properties.get('pubStatus.approve');
   //added firstLeadDeliveryDate in query-Sonali
   pool.query("select p.pID,p.publisherName,p.rating,c.clientCampID,c.CPL as campCPL, c.startDate,c.firstLeadDeliveryDate,c.endDate,p.gdprCompliance from campaign c  join user_mapping um on c.agencyID=um.agencyID join publisher p on um.pID=p.pID where c.campID='" + campID + "' and p.gdprCompliance='No' and c.agencyID='" + agencyID + "' and um.agencyStatus='" + approve + "' and um.publisherStatus='" + approve + "'  group by p.pID order by p.rating asc limit 10", function (error, results, fields) {
     if (error) {
       log.error("Error inside assignNoGDPRPublisher==>" + error);
       return res.status(400).json(errors);
     } else {
       res.send(JSON.stringify(results));
       ////
     }
   });// //////
 });
 
 /**
 * @author somnath keswad
 * @param  Description getting All campaign from campaign table which status is New and AllocatingInProgress
 */
 
 router.get("/allocatingCampaign", function (req, res, next) {
   log.info("inside allocatingCampaign");
   var agencyID = url.parse(req.url, true).query.agencyID;
   var errors;
   var newStatus = properties.get('agencyStatus.newCampaign');
   var progressStatus = properties.get('agencyStatus.partialAllocation');
   var query = "select c.agencyID,c.campID,c.parentCampID,c.reallocationID,c.clientCampID,c.campaignName,c.ABM,c.startDate,c.endDate,c.currency,c.timezone,c.leadAllocation,c.requiredLeadPerAsset,c.budget,  (c.leadAllocation -sum(pa.allocatedLead)) AS pendingLead  from campaign c left join publisher_allocation pa on c.campID = pa.campID join agency_details ad on c.agencyID=ad.agencyID where (c.status='" + newStatus + "'and ad.agencyID='" + agencyID + "') OR  (c.status = '" + progressStatus + "'and ad.agencyID='" + agencyID + "')group by c.campID order by c.campID desc";
   pool.query(query, function (error, results, fields) {
     if (error) {
       log.error("Error inside allocatingCampaign==>" + error);
       return res.status(400).json(errors);
     } else {
       res.send(JSON.stringify(results));
       ////
     }
   });
   // //
 });
 
 /*@author somnath keswad
  * Desc when I click on allocated leads open a new popup which will show publisher name, total budget and allocated leads
  @version 1.0
  */
 
 router.get("/viewPubAssignLead",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside viewPubAssignLead");
   var campID = url.parse(req.url, true).query.campID;
   var accept = properties.get('pubStatus.acceptCampaign');
   var counter = properties.get('pubStatus.counterCampaign');
   var assign = properties.get('agencyStatus.newAllocation');
   var acceptedCounter = properties.get('agencyStatus.acceptCounter');
   var pause = properties.get('agencyStatus.pauseCampaign');
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   var lp_pending = properties.get("pubStatus.pendingCampaign");
   pool.query(
     "select c.campID,pa.pID,c.campaignStatus,c.agencyID,c.leadAllocation,sum( pa.allocatedLead) as allocatedLead,c.requiredLeadPerAsset,(c.leadAllocation - sum(pa.allocatedLead))  AS pendingLead,c.budget,c.currency,c.startDate as campStartDate,c.endDate as campEndDate,c.ABM, pa.cpl,round(sum(pa.allocatedLead*pa.cpl),2) AS allocatedBudget,round((c.budget-sum(pa.allocatedLead*pa.cpl)),2)  as remainingBudget from campaign c left join publisher_allocation pa on c.campID = pa.campID and  (pa.status='" + assign + "' or pa.status='" + accept + "' or pa.status='" + acceptedCounter + "' or pa.status='" + counter + "' or pa.status='" + pause + "' or pa.status='" + cancelALU + "' or pa.status='" + lp_pending + "') left join publisher p on pa.pID=p.pID  WHERE  c.campID ='" + campID + "'",
     [campID],
 
     function (error, results, fields) {
       if (error) {
         log.error("Error inside viewPubAssignLead==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //
     }
   );// //
 });
 /*@author somnath keswad
  * Desc when I click on allocated leads open a new popup which will show publisher list
  @version 1.0
  */
 
 router.get("/pendingAllocationDetails", function (req, res, next) {
   log.info("inside pendingAllocationDetails");
   var campID = url.parse(req.url, true).query.campID;
   pool.query("select c.campID,c.clientCampID,pa.pID,c.leadAllocation,p.publisherName,pa.startDate,pa.allocationID,pa.status,pa.endDate,DATEDIFF(pa.endDate,CURDATE()) AS daysLeft, sum( pa.allocatedLead) as allocatedLead,(c.leadAllocation -sum( pa.allocatedLead)) AS pendingLead,c.budget, pa.cpl,   round((sum(pa.allocatedLead) * pa.cpl),2) AS allocatedBudget, ((c.leadAllocation - sum(pa.allocatedLead)) * pa.cpl) as remainingBudget   from campaign c join publisher_allocation pa on c.campID = pa.campID  join publisher p on pa.pID = p.pID WHERE (c.campID = '" + campID + "' and pa.status='Assign') or (c.campID = '" + campID + "' and pa.status='AcceptedCounter') or (c.campID = '" + campID + "' and pa.status='Accept' )or (c.campID = '" + campID + "' and pa.status='Counter') group by publisherName",
     [campID],
 
     function (error, results, fields) {
       if (error) {
         log.error("Error inside pendingAllocationDetails==>" + error);
         throw error;
       }
       results["count"] = 0;
       res.send(JSON.stringify(results));
       //
     }
   );// //
 });
 
 /*@author Ram Chander
  * Desc when I click on allocated leads open a new popup which will show publisher list
  @version 1.0
  */
 router.get("/allocatedCampaignDetails", function (req, res, next) {
   log.info("inside allocatedCampaignDetails");
   var campID = url.parse(req.url, true).query.campID;
   // var status='Reject';
   pool.query(
     "select c.campID,c.clientCampID,pa.pID,c.leadAllocation,p.publisherName,pa.startDate,pa.endDate,DATEDIFF(pa.endDate,CURDATE()) AS daysLeft,sum( pa.allocatedLead) as allocatedLead,(c.leadAllocation -sum( pa.allocatedLead)) AS pendingLead,\
     c.budget, pa.cpl, round((sum(pa.allocatedLead) * pa.cpl),2) AS allocatedBudget, ((c.leadAllocation - sum(pa.allocatedLead)) * pa.cpl) as remainingBudget from campaign c join publisher_allocation pa on c.campID = pa.campID\
      join publisher p on pa.pID = p.pID WHERE (c.campID = '"+ campID + "' and pa.status='Assign') or (c.campID = '" + campID + "' and pa.status='AcceptedCounter') group by publisherName",
     [campID],
 
     function (error, results, fields) {
       if (error) {
         log.error("Error inside allocatedCampaignDetails==>" + error);
         throw error;
       }
       results["count"] = 0;
       res.send(JSON.stringify(results));
       //
     }
   );// //
 });
 
 /*@author Ram Chander
  * Desc when I click on allocated leads open a new popup which will show publisher list
  @version 1.0
  */
 router.get("/liveCampaignDetails",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside liveCampaignDetails");
   var campID = url.parse(req.url, true).query.campID;
 
   var assign = properties.get('agencyStatus.newAllocation');
   var reAssign = properties.get('agencyStatus.reAssign');
   var accept = properties.get('pubStatus.acceptCampaign');
   var reject = properties.get('pubStatus.rejectCampaign');
   var acceptedCounter = properties.get('agencyStatus.acceptCounter');
   var counter = properties.get('pubStatus.counterCampaign');
   var rejectedCounter = properties.get('agencyStatus.rejectCounter');
   var cancel = properties.get('publisher.cancelPublisher');
   var clientAcceptedStatus = properties.get('clientReviewLead.clientAccepted.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
 
   //Supriya Gore - Task - 3001 - status used for completed campaign allocation count issue
   //start status
   var lp_pending = properties.get('pubStatus.pendingCampaign');
   var live_incomplete = properties.get('pubStatus.live_incomplete');
   var paused_incomplete = properties.get('pubStatus.paused_incomplete');
   var completed = properties.get('pubStatus.completed');
   var paused = properties.get('agencyStatus.pauseCampaign');
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   //end status
 
   //Supriya Gore - Task - 3001 - query changed for adding completed campaign end date, days left and allocation count issue
   var sql1 = "select c.campID,c.currency,c.reallocationID,pa.status,pa.previousStatus,c.campaignStatus,pa.pID,c.leadAllocation,c.parentCampID,p.publisherName,max(pa.startDate) as startDate,(select MAX(endDate) from publisher_allocation where status IN('" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and campID='" + campID + "' and pID=p.pID) as endDate,(select MAX(endDate) from publisher_allocation where previousStatus IN('" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and status IN('" + paused + "') and campID='" + campID + "' and pID=p.pID) as pausedEndDate,(select DATEDIFF(MAX(endDate),CURDATE()) from publisher_allocation where status IN('" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and campID='" + campID + "' and pID=p.pID) AS daysLeft,(select DATEDIFF(MAX(endDate),CURDATE()) from publisher_allocation where previousStatus IN('" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and status IN('" + paused + "') and campID='" + campID + "' and pID=p.pID) AS pausedDaysLeft,(select MAX(endDate) from publisher_allocation where previousStatus IN('" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and campID='" + campID + "' and pID=p.pID) as completedEndDate,(select DATEDIFF(MAX(endDate),CURDATE()) from publisher_allocation where previousStatus IN('" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and campID='" + campID + "' and pID=p.pID) AS completedDaysLeft,sum( pa.allocatedLead) as allocatedLead,sum(case when pa.status = '" + accept + "' or pa.status='" + lp_pending + "' then pa.allocatedLead else 0 end) Accept, sum(case when pa.status = '" + assign + "' or pa.status= '" + reAssign + "' then pa.allocatedLead else 0 end) Assign,sum(case when pa.status = '" + counter + "' then pa.counterLead else 0 end) Counter,sum(case when pa.status = '" + cancelALU + "' then pa.allocatedLead else 0 end) cancelALU, sum(case when pa.status = '" + reject + "' then pa.allocatedLead else 0 end) Reject, sum(case when pa.status = '" + acceptedCounter + "' then pa.allocatedLead else 0 end) AcceptedCounter, sum(case when pa.status = '" + rejectedCounter + "' then pa.counterLead else 0 end) RejectedCounter, sum(case when (pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.previousStatus IN('" + accept + "','" + lp_pending + "','" + paused + "','" + live_incomplete + "','" + paused_incomplete + "','" + completed + "')) then pa.allocatedLead else 0 end) completedAccept,sum(case when (pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.previousStatus IN('" + assign + "','" + reAssign + "')) then pa.allocatedLead else 0 end) completedAssign,sum(case when (pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.previousStatus IN('" + counter + "')) then pa.allocatedLead else 0 end) completedCounter,sum(case when (pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.previousStatus IN('" + acceptedCounter + "')) then pa.allocatedLead else 0 end) completedAcceptedCounter,sum(case when (pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.previousStatus IN('" + reject + "')) then pa.allocatedLead else 0 end) completedReject,sum(case when (pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.previousStatus IN('" + rejectedCounter + "')) then pa.allocatedLead else 0 end) completedRejectedCounter,sum(case when (pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.previousStatus IN('" + cancelALU + "')) then pa.allocatedLead else 0 end) completedCancelALU, sum(case when (pa.status IN('" + paused + "') and pa.previousStatus IN('" + accept + "','" + lp_pending + "')) then pa.allocatedLead else 0 end) pausedAccept,sum(case when (pa.status IN('" + paused + "') and pa.previousStatus IN('" + assign + "','" + reAssign + "')) then pa.allocatedLead else 0 end) pausedAssign,sum(case when (pa.status IN('" + paused + "') and pa.previousStatus IN('" + counter + "')) then pa.allocatedLead else 0 end) pausedCounter,sum(case when (pa.status IN('" + paused + "') and pa.previousStatus IN('" + acceptedCounter + "')) then pa.allocatedLead else 0 end) pausedAcceptedCounter,sum(case when (pa.status IN('" + paused + "') and pa.previousStatus IN('" + reject + "')) then pa.allocatedLead else 0 end) pausedReject,sum(case when (pa.status IN('" + paused + "') and pa.previousStatus IN('" + rejectedCounter + "')) then pa.allocatedLead else 0 end) pausedRejectedCounter,sum(case when (pa.status IN('" + paused + "') and pa.previousStatus IN('" + cancelALU + "')) then pa.allocatedLead else 0 end) pausedCancelALU,(c.leadAllocation -sum( pa.allocatedLead)) AS pendingLead, c.budget,c.startDate as campStartDate,c.endDate as campEndDate,c.ABM, pa.cpl, ROUND(((sum(case when pa.status = '" + assign + "' OR pa.status = '" + accept + "' or pa.status='" + lp_pending + "' OR  pa.status = '" + counter + "' OR pa.status = '" + acceptedCounter + "' then pa.allocatedLead else 0 end)) * pa.cpl),2) AS allocatedBudget,  ROUND(((sum(case when (pa.previousStatus IN( '" + assign + "','" + accept + "','" + lp_pending + "','" + counter + "','" + acceptedCounter + "','" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and pa.status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "'))then pa.allocatedLead else 0 end)) * pa.cpl),2) AS completedAllocatedBudget,ROUND(((sum(case when (pa.previousStatus IN( '" + assign + "','" + accept + "','" + lp_pending + "','" + counter + "','" + acceptedCounter + "') and pa.status IN('" + paused + "'))then pa.allocatedLead else 0 end)) * pa.cpl),2) AS pausedAllocatedBudget, ((c.leadAllocation - sum(pa.allocatedLead)) * pa.cpl) as remainingBudget from campaign c join publisher_allocation pa on c.campID = pa.campID  join publisher p on pa.pID = p.pID WHERE c.campID = ? AND pa.status NOT IN ('" + cancel + "') group by publisherName";
 
   pool.query(sql1, [campID], function (error, results, fields) {
     if (error) {
       log.error("Error inside liveCampaignDetails==>" + error);
       throw error;
     }
     else {
 
       //Supriya Gore - Task - 3001 - change end date, days left and allocation count issue in main array(results)
       for (var d = 0; d < results.length; d++) {
         if (results[d].status === live_incomplete || results[d].status === paused_incomplete || results[d].status === completed) {
           results[d].Accept = results[d].completedAccept;
           results[d].Assign = results[d].completedAssign;
           results[d].Counter = results[d].completedCounter;
           results[d].cancelALU = results[d].completedCancelALU;
           results[d].Reject = results[d].completedReject;
           results[d].AcceptedCounter = results[d].completedAcceptedCounter;
           results[d].RejectedCounter = results[d].completedRejectedCounter;
           results[d].allocatedBudget = results[d].completedAllocatedBudget;
           results[d].endDate = results[d].completedEndDate;
           results[d].daysLeft = results[d].completedDaysLeft;
 
         } else if (results[d].status === paused) {
           results[d].endDate = results[d].pausedEndDate;
           results[d].daysLeft = results[d].pausedDaysLeft;
           results[d].Accept = results[d].pausedAccept;
           results[d].Assign = results[d].pausedAssign;
           results[d].Counter = results[d].pausedCounter;
           results[d].cancelALU = results[d].pausedCancelALU;
           results[d].Reject = results[d].pausedReject;
           results[d].AcceptedCounter = results[d].pausedAcceptedCounter;
           results[d].RejectedCounter = results[d].pausedRejectedCounter;
           results[d].allocatedBudget = results[d].pausedAllocatedBudget;
         }
 
       }
 
       //Supriya Gore - Task - 3001 - for max end date if campaign is not in accept, lp_pending, counter, accepted counter, assign status then get default max end date
       for (var i = 0; i < results.length; i++) {
         (function (j) {
 
           //Supriya Gore - Task - 3001 - for if endDate is in not accept, lp_pending, counter, accepted counter, assign status
           if (results[j].endDate === null || results[j].endDate === "null" || results[j].endDate === undefined || results[j].endDate === "undefined") {
             var pubQuery = "";
             //Supriya Gore - Task - 3001 - if publisher campaign in live incomplete, paused incomplete or completed status
             if (results[j].status === live_incomplete || results[j].status === paused_incomplete || results[j].status === completed) {
               pubQuery = "select MAX(endDate) as endDate,DATEDIFF(MAX(endDate),CURDATE()) as daysLeft,status from publisher_allocation where campID='" + campID + "' and status IN('" + live_incomplete + "','" + paused_incomplete + "','" + completed + "') and previousStatus NOT IN ('" + cancel + "','" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and pID='" + results[j].pID + "'";
             }
             //Supriya Gore - Task - 3001 - if publisher campaign in paused status
             else if (results[j].status === paused) {
               pubQuery = "select MAX(endDate) as endDate,DATEDIFF(MAX(endDate),CURDATE()) as daysLeft,status from publisher_allocation where campID='" + campID + "' and status IN('" + paused + "') and previousStatus NOT IN ('" + cancel + "','" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and pID='" + results[j].pID + "'";
             }
             //Supriya Gore - Task - 3001 - if publisher in active status
             else {
               pubQuery = "select MAX(endDate) as endDate,DATEDIFF(MAX(endDate),CURDATE()) as daysLeft,status from publisher_allocation where campID='" + campID + "' and status NOT IN ('" + cancel + "','" + accept + "','" + acceptedCounter + "','" + lp_pending + "','" + counter + "','" + assign + "') and pID='" + results[j].pID + "'";
             }
 
             pool.query(pubQuery, function (error, otherStatusPubResult, fields) {
               if (error) {
                 log.error("Error=in Update Campaign Status" + error);
                 return res.status(400).json(errors);
               } else {
                 for (var m = 0; m < otherStatusPubResult.length; m++) {
                   // if(otherStatusPubResult[m].status===reject || otherStatusPubResult[m].status===rejectedCounter)
                   // {
                   results[j].endDate = otherStatusPubResult[m].endDate;
                   results[j].daysLeft = otherStatusPubResult[m].daysLeft;
                   // }
                 }
               }
             })
           }
           var sql = "select status from publisher_allocation where campID='" + campID + "' and status NOT IN ('Cancel') and pID='" + results[j].pID + "' and lastUpdated in (select MAX(lastUpdated) from publisher_allocation where campID='" + campID + "' and pID='" + results[j].pID + "' and status NOT IN ('Cancel'))  order by FIELD(status,'Accept','Assign','AcceptedCounter','Counter','RejectedCounter','Reject')";
           pool.query(sql, function (error, statusPIDResult, fields) {
             if (error) {
               log.error("Error=in Update Campaign Status" + error);
               return res.status(400).json(errors);
             } else {
               if (statusPIDResult.length > 0) {
                 results[j].status = statusPIDResult[0].status;
               }
 
             }
           })
 
         })(i)
       }
 
       var sql = "select lf.campID,sd.supportDocID, lf.pID, lf.leadInfoID,lf.assetName,count(lf.leadInfoID) as leadInfoCount,c.leadAllocation,sd.leadPerAsset as leadCountPerAsset,c.requiredLeadPerAsset ,   if(count(lf.leadInfoID)>=sd.leadPerAsset,sd.leadPerAsset,count(lf.leadInfoID)) as acceptedLeadsPerAsset,sd.leadPercentage  from lead_info lf join lead_info_status ls on ls.leadInfoID=lf.leadInfoID join campaign c on    lf.campID=c.campID join supporting_document sd on sd.campID=lf.campID and sd.suppDocName=lf.assetName where (ls.status='Accepted' and  c.campID='" + campID + "') or (ls.status='" + clientAcceptedStatus + "' and  c.campID='" + campID + "') or (ls.status='" + agencyInternalReview + "' and  c.campID='" + campID + "')  group by sd.supportDocID ,lf.pID";
       pool.query(sql, function (error, leads, fields) {
         if (error) {
           log.error("Error=in Update Campaign Status" + error);
 
           return res.status(400).json(errors);
         } else {
           for (var i = 0; i < results.length; i++) {
             (function (k) {
               var totAcceptedLead = 0;
               var allocatedLead = parseInt(results[k].allocatedLead);
               var leadInfoCount = 0;
               var assetLeads = 0.0;
               for (var j = 0; j < leads.length; j++) {
                 if (leads[j].pID == results[k].pID) {
                   var leadPercentage = parseFloat(leads[j].leadPercentage);
                   var aLead = parseFloat(allocatedLead * leadPercentage / 100);
                   assetLeads = assetLeads + aLead;
                   totAcceptedLead = totAcceptedLead + parseFloat(leads[j].acceptedLeadsPerAsset);
                   leadInfoCount = parseFloat(leads[j].leadInfoCount);
                   leadInfoCount = leadInfoCount + leadInfoCount;
                 }
               }
               if (leadInfoCount >= assetLeads) {
                 results[k].totAcceptedLead = Math.round(assetLeads);
               } else {
                 results[k].totAcceptedLead = Math.round(totAcceptedLead);
               }
               // results[i].totAcceptedLead=totAcceptedLead
             })(i);
           }
           res.send(JSON.stringify(results));
           //
         }
       });////
     }
   });
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description handle the assign delivered lead 
  * @return Description return delivered lead array
  */
 router.get("/viewPubAssignDeliveredLead",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside viewPubAssignDeliveredLead");
   var campID = url.parse(req.url, true).query.campID;
   var status = "Delivered";
   var QA_Review = properties.get('download.QA_Review.status');
   var DI_QA_Accepted = properties.get('reviewLead.acceptedDI.status');//Supriya Task:3391 - getting DI QA Accepted status
   var accepted = properties.get('download.accepted.status');
   var rejected = properties.get('download.rejected.status');
   var clientAccepted = properties.get('clientReviewLead.clientAccepted.status');
   var clientRejected = properties.get('clientReviewLead.clientRejected.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var assetRemovalStatus = properties.get('agencyStatus.asset.REJECT_ASSET_REMOVED');
   // res.locals.connection.query(
   //   "SELECT pID,count(status) as count FROM lead_info WHERE campID='"+campID+"' AND status='"+status+"'  GROUP BY pID",
 
   //Narendra - Adding clientAccepted and clientRejected in query for client accept and reject lead
   //Supriya Task:3391 - DI_QA_Accepted status added in lead
   var query = "SELECT li.campID,li.pID,Sum(CASE WHEN status = '" + accepted + "' OR status='" + QA_Review + "' OR status='" + clientAccepted + "' OR status='" + agencyInternalReview + "' OR status ='" + rejected + "' OR status='" + clientRejected + "'  OR status='" + assetRemovalStatus + "' THEN 1 ELSE 0 END) as deliveredLead,Sum(CASE WHEN status = '" + accepted + "' OR status='" + clientAccepted + "' THEN 1 ELSE 0 END) as acceptedLead, Sum(CASE WHEN status ='" + rejected + "' OR status='" + clientRejected + "'  OR status='" + assetRemovalStatus + "'   THEN 1 ELSE 0 END) as rejectedLead,Sum(CASE WHEN status IN('" + QA_Review + "','"+DI_QA_Accepted+"') THEN 1 ELSE 0 END) as qaReviewLead,Sum(CASE WHEN status = '" + agencyInternalReview + "' THEN 1 ELSE 0 END) as agencyInternalReviewLead FROM   lead_info li INNER JOIN lead_info_status lis ON lis.leadInfoID = li.leadInfoID where campID='" + campID + "' group by li.pID"
   // SELECT campID,pID,delieveredLead,acceptedLead,rejectedLead,balance, ROUND((acceptedLead/(acceptedLead+balance)*100)) AS percentage FROM lead_info_temp WHERE campID="+campID;
 
   pool.query(query,
     function (error, results, fields) {
       if (error) {
         log.error("Error inside viewPubAssignDeliveredLead==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //
     }
   );
   ////
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description handle the multiple allocatation 
  * @return Description return successfully allocate message
  */
 //Somnath Task-3858, Add checkAuth middleware
 router.post("/assignCampaign",authCheck, function (req, res, next) {
   log.info("inside assignCampaign");
   var success;
   var errors;
   /***For Email functionality***/
   var user = req.token;//Somnath Task-3858, Get Token from request
   let campaignDetail = [];
   /****End */
   var campID = req.body.campID;
   var leadAllocation = req.body.leadAllocation;
   var leadAllocationCamp = parseInt(leadAllocation);
   var assign = properties.get('agencyStatus.newAllocation');
   var allocatingInProgress = properties.get('agencyStatus.partialAllocation');
   var description=campaignTraceProperties.get('campaign.allocation.new');//Sonali-3257-get details from properties file
   var pubAllocatedLeadSum;
   var newDynamicArray = [];
   var cancel = properties.get('publisher.cancelPublisher');
   var reject = properties.get('pubStatus.rejectCampaign');
   var rejectedCounter = properties.get('agencyStatus.rejectCounter');
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   var newPacing = properties.get('publisher.newPacing');
   var IONumber;
    let pIDArray=[];
   newDynamicArray = req.body.dynamicArray;
 
   const result = Array.from(new Set(newDynamicArray.map(p => p.pID))).map(pID => {
     return {
       pID: pID,
       publisherName: newDynamicArray.find(p => p.pID === pID).publisherName,
       startDate: newDynamicArray.find(p => p.pID === pID).startDate,
       endDate: newDynamicArray.find(p => p.pID === pID).endDate,
       firstLeadDeliveryDate: newDynamicArray.find(p => p.pID === pID).firstLeadDeliveryDate,
       allocatedLead: newDynamicArray.find(p => p.pID === pID).allocatedLead,
       cpl: newDynamicArray.find(p => p.pID === pID).cpl != null ? newDynamicArray.find(p => p.pID === pID).cpl : newDynamicArray.find(p => p.pID === pID).campCPL,
       poNumber:newDynamicArray.find(p=>p.pID===pID).poNumber//Sonali-3519-get PO number
      };
   });
  
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
 
   for (var i = 0, l = result.length; i < l; i++) {
     if (result[i].allocatedLead == undefined || result[i].allocatedLead == '') {
     }
     else {
 
       // In else Block for comparision for allocated leads and lead allocation
       try {
         /*** check if previous record is exist or not with status Assign if exist then update it else insert */
         (function (j) {
           var newAllocation = parseInt(result[j].allocatedLead);
           var checkstate = "select * from publisher_allocation where campID='" + req.body.campID + "' and pID='" + result[j].pID + "' and status='" + assign + "'";
           pool.query(checkstate, function (error, checkData, fields) {
             if (error) {
               log.error("Error AutoComplete In logTable=" + error);
             } else {
               var oldAllocation = 0;
               for (var k = 0; k < checkData.length; k++) {
                 oldAllocation = oldAllocation + parseInt(checkData[k].allocatedLead);
               }
               var allocatedLead = 0;
               allocatedLead = oldAllocation + newAllocation;
               var allocationID = 0;
               if (checkData.length > 1) {/** delete record if same campID,pID & status=Assign can have more than one record then delete it and insert it New record with Assign Status */
                IONumber=checkData[0].IO_No; //Sonali-3519-get existing IO number
                var deleteData = "delete from publisher_allocation where campID='" + campID + "' and pID='" + result[j].pID + "'and status='" + assign + "'";
                 pool.query(deleteData, function (err, results, fields) {
                   if (err) {
                     log.error("inside publisher.js/Error=" + err);
                   }
                 });
 
                 // for(var d=0;d<checkData.length;d++)
                 // {
                 // var allocateData="select pubPacingID from publisher_pacing where allocationID='"+checkData[d].allocationID+"'";
                 // pool.query(allocateData,function (err, allocateResults, fields) {
                 //   if (err) {log.error("Error=" + err);}
                 // else
                 // {
                 //   if(allocateResults.length>0)
                 //   {
                 // var deletePacingData="delete from publisher_pacing where allocationID='"+checkData[d].allocationID+"'";
                 // pool.query(deletePacingData,function (err, results, fields) {
                 //   if (err) {log.error("Error=" + err);}});
                 // }
                 // }
                 // });
                 // }
               }
               if (checkData.length == 1) {
                 //Sonali-3519-added PO number in the below query
                 var sql = "update publisher_allocation set startDate='" + result[j].startDate + "',enddate='" + result[j].endDate + "',firstLeadDeliveryDate='" + result[j].firstLeadDeliveryDate + "',allocatedLead='" + allocatedLead + "',CPL='" + parseFloat(result[j].cpl).toFixed(2) + "',lastUpdated='" + formatted + "',PO_No='"+result[j].poNumber+"' where pID='" + result[j].pID + "'and campID='" + req.body.campID + "' and status='" + assign + "'";
                 allocationID = checkData[0].allocationID;
                 // var deletePacingData="delete from publisher_pacing where allocationID='"+checkData[0].allocationID+"'";
                 // pool.query(deletePacingData,function (err, results, fields) {
                 //   if (err) {log.error("Error=" + err);}});
                 pool.query(sql, function (err, allocateResults, fields) {
                  if (err) {
                    log.error("Error=" + err);
                    errors = "Campaign not allocated";
                    return res.status(400).json(errors);
                  } else {
                    success = "Campaign allocation done successfully.Please click on close button to allocate other campaigns.";
                    if (allocateResults.insertId == 0) {
  
                    } else {
                      allocationID = allocateResults.insertId;
                    }
  
  
                  }
                  // res.send(JSON.stringify(results));
                });
               }
               else {
                //Sonali-3519-get publisher details 
                   var getPublisher="select pID,campID,IO_No from publisher_allocation where pID='"+result[j].pID+"' and campID='"+req.body.campID+"'";
                   pool.query(getPublisher,function(error1,details,field){
                     if(error1){
                       log.error("Error inside publisher/assignCampaign==>"+error1)
                     }
                     else{
                       if(details.length>0){
                         //Sonali-3519-if record already exists then get the IO number
                        IONumber=details[0].IO_No;
                       }
                       else{
                         //Sonali-3519-generate new IO number
                        IONumber=randomstring.generate({
                          length: 8,
                          charset: 'alphanumeric'
                        });
                       }
                  var po_number=result[j].poNumber;
                  //Sonali-3519-if IO or PO numbers are undefined or null make it blank
                  if(po_number==""||po_number==null||po_number=="null"||po_number==undefined||po_number=="undefined"){
                    po_number="";
                  }
                  if(IONumber==""||IONumber==null||IONumber=="null"||IONumber==undefined||IONumber=="undefined"){
                    IONumber="";
                  }
                 var sql = "insert into publisher_allocation (pID,campID,startDate,endDate,firstLeadDeliveryDate,allocatedLead,CPL,PO_No,IO_No,created,lastUpdated,status) values('" + result[j].pID + "','" + req.body.campID + "','" + result[j].startDate + "','" + result[j].endDate + "','" + result[j].firstLeadDeliveryDate + "','" + allocatedLead + "','" + parseFloat(result[j].cpl).toFixed(2) + "','"+po_number+"','"+IONumber+"','" + formatted +
                   "','" + formatted + "','" + assign + "')";
 
               
               pool.query(sql, function (err, allocateResults, fields) {
                 if (err) {
                   log.error("Error=" + err);
                   errors = "Campaign not allocated";
                   return res.status(400).json(errors);
                 } else {
                   success = "Campaign allocation done successfully.Please click on close button to allocate other campaigns.";
                   if (allocateResults.insertId == 0) {
 
                   } else {
                     allocationID = allocateResults.insertId;
                   }
 
 
                 }
                 // res.send(JSON.stringify(results));
               });
              }
            });
              }
               var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + result[j].pID + "','" + assign + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
               pool.query(sql1, function (err, results, fields) {
                 if (err) {
                   log.error("publisher.js/Error=" + err);
                 }
                 else {
                 }
               });
             }
           });/** End of Selecting publisher_allocation Details checking for data is exist or not */
 
           /**
           * @author Narendra Phadke
           * @param  Description handle the Alerts Functionality 
           * @return Description return insert alerts
           */
           let description = propertiesNotification.get('publisher.allocate.notification');
           let messageStatus = properties.get('Message.Unread');
           let queryAlerts = "insert into conversation_alerts SET ?",
             values = {
               campID: campID,
               agencyID: user.id,
               pID: result[j].pID,
               advertiserID: 0,
               userID: user.userID,
               sender: user.id,
               receiver: result[j].pID,
               description: description,
               status: messageStatus,
               created: formatted,
               lastUpdated: formatted
             };
 
           pool.query(queryAlerts, values, function (error, results, fields) {
             if (error) {
               log.error("Alerts inside campaign allocate to publisher Error==" + error);
             } else {
               log.info("inserted successfully in alerts")
             }
           });
 
         })(i);
       } catch (err) {
         errors.publisher = "Campaign not allocated";
         return res.status(400).json(errors);
       }
       //Copy Allovated Detail to one array to other array For email functionality
       campaignDetail.push(Object.assign({}, result[i]));
     }
 
   }//End Of For loop
   //Narendra - give timeout because it excute before previous excution so now it stop
   setTimeout(() => {
 
     pool.query("select sum(allocatedLead) as allocatedLeads from publisher_allocation where campID ='" +
       campID + "' and status NOT IN('Cancel')",
       function (error, results, fields) {
         if (error) {
           log.error("Error inside assignCampaign==>" + error);
           throw error;
         }
         pubAllocatedLeadSum = results[0].allocatedLeads;
 
         if (leadAllocationCamp > pubAllocatedLeadSum) {
           var updateStat = "UPDATE campaign SET status ='" + allocatingInProgress + "',lastUpdated ='" + formatted + "' WHERE campID ='" + campID + "'";
         } else {
 
           var updateStat = "UPDATE campaign SET status ='" + assign + "',lastUpdated ='" + formatted + "' WHERE campID ='" + campID + "'";
         }
         pool.query(updateStat,
           function (error, results, fields) {
             if (error) {
               errors.publisher = "Campaign Not Allocated";
               return res.status(400).json(errors);
             }
           }
         );
       });
   }, 1000);
 
   /**
 * @author Narendra Phadke
 * @param  Description handle the Email Functionality 
 * @return Description return successfully allocate message
 */
   setTimeout(() => {
     var user_role = "PC";
     var user_role1 = "AC";
     var orgID = user.id;
     var row = [];
     var k;
 
     for (var s = 0; s < campaignDetail.length; s++) {
       let count = s;
       //get all agency details from user_details table
       var queryTemp = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud  join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' AND ud.orgID='" + campaignDetail[s].pID + "'  AND ec.campaignAllocation='Yes' ) OR (ud.role='" + user_role1 + "' and ud.orgID='" + orgID + "'  AND ec.campaignAllocation='Yes' )";
 
       pool.query(queryTemp,
         function (err, results, fields) {
           if (err) {
             log.error("publisher.js/Error=" + err);
             errors.publisher = "Campaign not allocated";
             return res.status(400).json(errors);
           } else {
 
             email.emailAllocated(user, campID, results, campaignDetail[count].pID, campaignDetail[count].startDate, campaignDetail[count].endDate, campaignDetail[count].allocatedLead, campaignDetail[count].cpl);
             success = "Campaign allocation done successfully please click on close button to allocate other campaigns";
           }
 
           //email.emailAllocated(user,campID,results,campaignDetail[i]);
           //return results;  
           // const data={campID:campID,userName:userName,pID:pID,subject:subject,userDetail:results,campaignDetail:campaignDetail};
         }
       );
       success = "Campaign allocation done successfully please click on close button to allocate other campaigns";
     }
   }, 1500);
 
 
   // res.send(JSON.stringify(sucess));
   success = "Campaign allocation done successfully";
   res.json({ success: true, message: success });
   //
 });
 
 
 /**
  * @author Supriya Gore
  * @param  Description handle the edit allocation 
  * @return Description return successfully edit allocation message
  */router.post("/editAllocation",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside editAllocation");
   //  let data = req.body;
   var success;
   var errors;
   /***For Email functionality***/
   var user = req.body.user;
   let campaignDetail = [];
   //  var publisherList = [];
   /****End */
   var campID = req.body.campID;
   var leadAllocation = req.body.leadAllocation;
   var leadAllocationCamp = parseInt(leadAllocation);
   var assign = properties.get('agencyStatus.newAllocation');
   var allocatingInProgress = properties.get('agencyStatus.partialAllocation');
   var description=campaignTraceProperties.get('campaign.edit.allocation');//Sonali-3257-get details from properties file
 
   var cancel = properties.get('publisher.cancelPublisher');
   var reject = properties.get('pubStatus.rejectCampaign');
   var rejectedCounter = properties.get('agencyStatus.rejectCounter');
   var pubAllocatedLeadSum;
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
   //var newData=JSON.stringify(newDynamicArray);
 
   const result = Array.from(new Set(newDynamicArray.map(p => p.pID))).map(pID => {
     return {
       pID: pID,
       publisherName: newDynamicArray.find(p => p.pID === pID).publisherName,
       startDate: newDynamicArray.find(p => p.pID === pID).startDate,
       endDate: newDynamicArray.find(p => p.pID === pID).endDate,
       firstLeadDeliveryDate: newDynamicArray.find(p => p.pID === pID).firstLeadDeliveryDate,
       //Saurabh Task - 3792 - Added PO Number.
       PO_No: newDynamicArray.find(p => p.pID === pID).PO_No,
       allocatedLead: newDynamicArray.find(p => p.pID === pID).allocatedLead,
       cpl: newDynamicArray.find(p => p.pID === pID).cpl != null ? newDynamicArray.find(p => p.pID === pID).cpl : newDynamicArray.find(p => p.pID === pID).CPL
     };
   });
 
 
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
 
   if (result[0].allocatedLead == undefined || result[0].allocatedLead == '') {
   }
   else {
 
     // In else Block for comparision for allocated leads and lead allocation
     //try {
     /*** check if previous record is exist or not with status Assign if exist then update it else insert */
     // (function(j){
 
     var newAllocation = parseInt(result[0].allocatedLead);
    //Saurabh Task - 3792 - Added PO Number in sql query.
     var sql = "update publisher_allocation set PO_No='" + result[0].PO_No + "',startDate='" + result[0].startDate + "',enddate='" + result[0].endDate + "',firstLeadDeliveryDate='" + result[0].firstLeadDeliveryDate + "',allocatedLead='" + newAllocation + "',CPL='" + parseFloat(result[0].cpl).toFixed(2) + "',lastUpdated='" + formatted + "' where pID='" + result[0].pID + "'and campID='" + req.body.campID + "' and status='" + assign + "'";
     pool.query(sql, function (err, results, fields) {
       if (err) {
         log.error("Error inside editAllocation==>" + err);
         //  errors = "Campaign not allocated";
         //  return res.status(400).json(errors);
       } else {
         success = "Edit allocation done successfully.";
       }
       // res.send(JSON.stringify(results));
     });
     var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + result[0].pID + "','" + assign + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
     pool.query(sql1, function (err, results, fields) {
       if (err) {
         log.error("Error inside editAllocation==>" + err);
       }
       else {
       }
     });
     // }});/** End of Selecting publisher_allocation Details checking for data is exist or not */
     // })(i);
     //  } catch (err) {
     //    errors.publisher = "Campaign not allocated";
     //    return res.status(400).json(errors);
     //  }
     //Copy Allovated Detail to one array to other array For email functionality
     campaignDetail.push(Object.assign({}, result[0]));
   }
 
   // }//End Of For loop
 
   //Narendra - give timeout because it excute before previous excution so now it stop
   setTimeout(() => {
     pool.query("select sum(allocatedLead) as allocatedLeads from publisher_allocation where campID ='" +
       campID + "' and status NOT IN('Cancel')",
       function (error, results, fields) {
         if (error) throw error;
         pubAllocatedLeadSum = results[0].allocatedLeads;
 
         var updateStat;
         if (leadAllocationCamp > pubAllocatedLeadSum) {
           updateStat = "UPDATE campaign SET status ='" + allocatingInProgress + "',lastUpdated ='" + formatted + "' WHERE campID ='" + campID + "'";
         } else {
           updateStat = "UPDATE campaign SET status ='" + assign + "',lastUpdated ='" + formatted + "' WHERE campID ='" + campID + "'";
         }
         pool.query(updateStat,
           function (error, results, fields) {
             if (error) {
               log.error("Error inside editAllocation==>" + error);
               errors.publisher = "Campaign Not Allocated";
               return res.status(400).json(errors);
             }
           }
         );
 
         var pubQuery = "select sum(allocatedLead) as allocatedLead from publisher_allocation where campID='" + campID + "' and pID='" + result[0].pID + "' and status NOT IN('" + cancel + "','" + rejectedCounter + "','" + reject + "')";
         pool.query(pubQuery, function (error, pubResult, fields) {
           if (error) {
           } else {
 
             var pacingPubQuery = "select pubPacingID,pacingMonth,pacingUnit,pacingPercentage,pacingLeadCount,pacingEndDate,pacingCarryForward,created from publisher_pacing where campID='" + campID + "' and pID='" + result[0].pID + "'";
             pool.query(pacingPubQuery, function (error, pacingPublisherResult, fields) {
               if (error) {
               } else {
 
                 if (pacingPublisherResult.length > 0) {
                   for (var r = 0; r < pacingPublisherResult.length; r++) {
                     (function (t) {
 
                       if (t == (pacingPublisherResult.length - 1)) {
                         var pacingLeadCount = parseInt(pubResult[0].allocatedLead) - publisherPacingLeadCount;
                         pacingPublisherResult[t].pacingLeadCount = pacingLeadCount;
 
                       } else {
                         var pacingLeadCount = parseInt(pacingPublisherResult[t].pacingPercentage) * parseInt(pubResult[0].allocatedLead) / 100;
                         pacingPublisherResult[t].pacingLeadCount = Math.round(pacingLeadCount);
                         publisherPacingLeadCount = publisherPacingLeadCount + pacingPublisherResult[t].pacingLeadCount;
                       }
 
                       var pubPacingQuery = "update publisher_pacing set ? where campID='" + campID + "' and pID='" + result[0].pID + "' and pacingMonth='" + pacingPublisherResult[t].pacingMonth + "'",
                         pacingValues = {
                           campID: campID,
                           pID: result[0].pID,
                           // allocationID:allocationID,
                           agencyID: user.id,
                           pacingMonth: pacingPublisherResult[t].pacingMonth,
                           pacingUnit: pacingPublisherResult[t].pacingUnit,
                           pacingPercentage: pacingPublisherResult[t].pacingPercentage,
                           pacingLeadCount: pacingPublisherResult[t].pacingLeadCount,
                           pacingEndDate: pacingPublisherResult[t].pacingEndDate,
                           pacingCarryForward: pacingPublisherResult[t].pacingCarryForward,
                           created: pacingPublisherResult[t].created,
                           lastUpdated: formatted
                         };
 
                       pool.query(pubPacingQuery, pacingValues, function (error, pacingPublisherResult1, fields) {
                         if (error) {
                           log.error("Error Allocation Pacing Campaign=" + error);
                         } else {
                         }
                       })
                     })(r)
                   }
                 }
 
               }
             })
           }
         })
         ////
       });
   }, 1000);
   /**
 * @author Supriya Gore
 * @param  Description handle the Email Functionality 
 * @return Description return successfully allocate message
 */
 
 
   var user_role = "PC";
   var user_role1 = "AC";
   var orgID = user.id;
   var row = [];
   var k;
 
   //  for (var s = 0; s < campaignDetail.length; s++) {
   //    let count = s;
   //get all agency details from user_details table
   //    var queryTemp = "select orgID,userName,role from user_details where (role='" + user_role + "' AND orgID='" + campaignDetail[0].pID + "') OR (role='" + user_role1 + "' and orgID='"+orgID+"')";
 
   //       res.locals.connection.query(queryTemp,
   //      function (err, results, fields) {
   //        if (err) {
   //          errors.publisher = "Campaign not allocated";
   //          return res.status(400).json(errors);
   //        } else {
   //          email.emailAllocated(user, campID, results, campaignDetail[0].pID, campaignDetail[0].startDate, campaignDetail[0].endDate, campaignDetail[0].allocatedLead, campaignDetail[0].cpl);
   //          success = "Campaign allocation done successfully please click on close button to allocate other campaigns";
   //        }
 
   //        //email.emailAllocated(user,campID,results,campaignDetail[i]);
   //        //return results;  
   //        // const data={campID:campID,userName:userName,pID:pID,subject:subject,userDetail:results,campaignDetail:campaignDetail};
   //      }
   //    );
   //    success = "Campaign allocation done successfully please click on close button to allocate other campaigns";
   //  //}
 
 
   // res.send(JSON.stringify(sucess));
   success = "Edit allocation done successfully";
   res.json({ success: true, message: success });
 });
 /*@author somnath keswad
  * Desc show the New Campaign in New Campaign Tab on publisher view byDefault to selected Publishers
  @version 1.0
  Date:24/12/2018
  */
 router.get("/newCampaign", function (req, res, next) {
   log.info("inside newCampaign");
   var errors;
   var pID = url.parse(req.url, true).query.pID;
   var counter = properties.get('pubStatus.counterCampaign');
   var assign = properties.get('agencyStatus.newAllocation');
   var acceptedCounter = properties.get('agencyStatus.acceptCounter');
   var sql = "select pa.allocationID, pa.campID,c.agencyID,c.parentCampID,c.reallocationID,pa.created,c.clientCampID, c.campaignName,c.ABM,pa.startDate,pa.endDate,pa.allocatedLead,pa.CPL,pa.status,c.currency   from campaign c join publisher_allocation pa on c.campID = pa.campID  join user_mapping um on um.pID=pa.pID and um.agencyID=c.agencyID  where (pa.pID = '" + pID + "' AND pa.status = '" + assign + "') OR (pa.pID = '" + pID + "'AND pa.status= '" + counter + "') or (pa.pID = '" + pID + "' AND pa.status= '" + acceptedCounter + "') order by pa.campID Desc";
 
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside newCampaign==>" + error);
       return res.status(400).json(errors);
     }
     else {
       res.send(JSON.stringify(results));
     }
   });
 });
 
 /*@author somnath keswad
  * Desc Display the Campaign Id and CPL on  Accept popups to the selected publisher
  @version 1.0
  Date:24/12/2018
  */
 //Somnath Task-3861, Add Auth Middleware
 router.get("/newCampaignID",authCheck, function (req, res, next) {
   log.info("inside newCampaignID");
   var allocationID = url.parse(req.url, true).query.allocationID;
   var sql = "select c.campID,c.clientCampID,c.agencyID,c.currency,pa.CPL,pa.pID,pa.allocationID,pa.startDate,pa.endDate,pa.allocatedLead,pa.counterLead,pa.counterCPL from campaign c \
   join publisher_allocation pa on c.campID = pa.campID  WHERE pa.allocationID='"+ allocationID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside newCampaignID==>" + error);
       return res.status(400).json(errors);
     }
     else {
       res.send(JSON.stringify(results));
     }
   }
   );
 });
 /**
        * @author Sonali Kalke
        * @param  Description pause publisher and move the respective campaign in pause campaign tab
        * @return 
        */
 
 router.post("/pausePublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside pausePublisher");
   var pID = req.body.pID;
   var campID = req.body.campID;
   var user = req.token;
   var description=campaignTraceProperties.get('campaign.pause.fullyAllocated');//Sonali-3257-get details from properties file
   var desc = "cancel allocation for Assigned publisher";
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var campaign_status = "campaign_paused";
   var pause = properties.get('publisher.pausePublisher');
   var accept = properties.get("pubStatus.acceptCampaign");
   var lp_pending = properties.get("pubStatus.pendingCampaign");
   var campaign_status = "campaign_paused";
   var cancel = properties.get('publisher.cancelPublisher');
   var assign = properties.get('publisher.assignPublisher');
 
   //sonali-3257-added below query to check whether allocation is in assign status,if then only update otherwise it was inserting 2 records in campaign log table
   var getAssignAllocations="select * from publisher_allocation where where pID='" + pID + "' and campID='" + campID + "' and status='" + assign + "'";
   pool.query(getAssignAllocations,function(err,result1,fields){
     if(result1.length>0){
    
   var sql = "update publisher_allocation set status='" + cancel + "' where pID='" + pID + "' and campID='" + campID + "' and status='" + assign + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside pausePublisher in update query==>" + error);
     }
     else {
       var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','Paused','" + desc + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
       pool.query(sql1, function (err, results, fields) {
         if (err) {
 
           log.error("Error inside pausePublisher in insert query==>" + error);
         }
       });
     }
   });
      
 }
 })
   /**** Changes in Query to get status to update previous status only by Somnath */
   var getPrevStatus = "select * from publisher_allocation where pID='" + pID + "' and campID='" + campID + "' and (status='" + accept + "' or status='" + lp_pending + "')";
   pool.query(getPrevStatus, function (error, preData, fields) {
     if (error) {
       log.error("Error inside pausePublisher in prevStatus query==>" + error);
     }
     else {
 
       var previousStatus = preData[0].status;
       var query = "update publisher_allocation set status='" + pause + "',previousStatus='" + previousStatus + "'   where pID='" + pID + "' and campID='" + campID + "' and (status='" + accept + "' or status='" + lp_pending + "')";
       pool.query(query, function (error, results, fields) {
         if (error) {
           log.error("inside publisher/Error is" + error);
         }
         else {
 
           var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','allocation_paused','" + desc + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
           pool.query(sql1, function (err, results, fields) {
             if (err) { log.error("Error=" + err); }
           });
 
 
           var totalLeads = 0;
           var sql1 = "select pa.pID,pa.allocatedLead,c.leadAllocation from publisher_allocation pa join campaign c on pa.campID=c.campID where pa.status='" + pause + "' and c.campID='" + campID + "'";
           pool.query(sql1, function (err, result, fields) {
             if (err) {
             }
             else {
               if (result.length > 0) {
                 for (var i = 0; i < result.length; i++) {
                   totalLeads = totalLeads + result[i].allocatedLead;
                 }
                 if (totalLeads == result[0].leadAllocation) {
                   var sql2 = "update campaign set campaignStatus='" + pause + "' where campID='" + campID + "'";
                   pool.query(sql2, function (error, result, fields) {
                     if (error) {
                       log.error("publisher.js/Error sql2 inside if==>" + error);
                     }
                     else {
                       var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','" + campaign_status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
                       pool.query(sql1, function (err, results, fields) {
                         if (err) {
                           log.error("publisher.js/Error=" + err);
                         }
                       });
                     }
                   });
                 }
               }
             }
           });
           var sql = "select ud.userName from user_details ud join email_configuration ec on ud.userID=ec.userID where ud.orgID='" + pID + "' and (ud.role='PC' or ud.role='PNC') and ec.pauseCampaign='" + emailConfigYes + "'";
           pool.query(sql, function (error, result, fields) {
             if (error) {
               log.error("publisher.js/Error is:" + error);
             }
             else {
               //emailID=result[0].userName;
 
               email.publisherPaused(campID, pID, result, user);
               /**
             * @author Narendra Phadke
             * @param  Description handle the Alerts Functionality 
             * @return Description return insert alerts
             */
 
               let description = propertiesNotification.get('campaign.paused.notification');
               let messageStatus = properties.get('Message.Unread');
               let queryAlerts = "insert into conversation_alerts SET ?",
                 values = {
                   campID: campID,
                   agencyID: user.id,
                   pID: pID,
                   advertiserID: 0,
                   userID: user.userID,
                   sender: user.id,
                   receiver: pID,
                   description: description,
                   status: messageStatus,
                   created: formatted,
                   lastUpdated: formatted
                 };
 
               pool.query(queryAlerts, values, function (error, results, fields) {
                 if (error) {
                   log.error("Alerts inside campaign pause to publisher Error==" + error);
                 } else {
                 }
               });
               res.send(JSON.stringify(results));
               //
 
             }
           });/**** End of Email Send */
         }
       });/***** Update Publisher is closed if status is accept or LP_Pending */
     }
   });/***** End of getting Previous data */
 });
 /**
        * @author Sonali Kalke
        * @param  Description resume publisher 
        * @return 
        */
 
 
 router.post("/resumePublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside resumePublisher");
   var pID = req.body.pID;
   var campID = req.body.campID;
   var user = req.token;
   var description=campaignTraceProperties.get('campaign.activate.pausedCampaign');//Sonali-3257-get details from properties file
   var campaign_status = "campaign_paused";
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var campaign_status = "campaign_resume";
   var pause = properties.get('publisher.pausePublisher');
 
   var accept = properties.get('publisher.resumePublisher');
   var acceptCampaign = properties.get('agencyStatus.activeCampaign');
   var prevStatus = "select * from publisher_allocation where pID='" + pID + "' and campID='" + campID + "' and status='" + pause + "'";
   pool.query(prevStatus, function (error, preData, fields) {
     if (error) {
       log.error("publisher.js/Error is" + error);
     }
     else {
       var previousStatus = preData[0].previousStatus;
 
       var query = "update publisher_allocation set status='" + previousStatus + "' where pID='" + pID + "' and campID='" + campID + "' and status='" + pause + "'";
       pool.query(query, function (error, results, fields) {
         if (error) {
           log.error("Error inside resumePublisher update query==>" + error);
         }
         else {
           var query = "update campaign set campaignStatus='" + acceptCampaign + "' where campID='" + campID + "'";
           pool.query(query, function (error, result, fields) {
             if (error) {
               log.error("publisher.js/error is" + err);
 
             }
             else {
               var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','" + campaign_status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
               pool.query(sql1, function (err, results, fields) {
                 if (err) {
                   log.error("publisher.js/Error=" + err);
                 }
               });
             }
           });
 
           var sql = "select ud.userName,ud.orgID from user_details ud join email_configuration ec on ud.userID=ec.userID  where ud.orgID='" + pID + "' and (ud.role='PC' or ud.role='PNC') and ec.resumeCampaign='" + emailConfigYes + "'";
           pool.query(sql, function (error, result, fields) {
             if (error) {
               log.error("publisher.js/Error is:" + error);
             }
             else {
               /**
                       * @author Narendra Phadke
                       * @param  Description handle the Alerts Functionality 
                       * @return Description return insert alerts
                       */
 
               let description = propertiesNotification.get('campaign.resume.notification');
               let messageStatus = properties.get('Message.Unread');
               let queryAlerts = "insert into conversation_alerts SET ?",
                 values = {
                   campID: campID,
                   agencyID: user.id,
                   pID: pID,
                   advertiserID: 0,
                   userID: user.userID,
                   sender: user.id,
                   receiver: pID,
                   description: description,
                   status: messageStatus,
                   created: formatted,
                   lastUpdated: formatted
                 };
 
               pool.query(queryAlerts, values, function (error, results, fields) {
                 if (error) {
                   log.error("Alerts inside campaign pause to publisher Error==" + error);
                 } else {
                 }
               });
 
               email.publisherResumed(campID, pID, result, user);
               res.send(JSON.stringify(results));
               //
             }
           });
         }
       });
     }
   });
 });
 
 
 /**
  * @author Supriya Gore
  * @param  Description handle the pending Campaign in publisher
  * @return Description return All pending Campaign in publisher
  */
 
 router.get("/pendingCampaign", function (req, res, next) {
   log.info("inside pendingCampaign");
   var errors;
   var pID = url.parse(req.url, true).query.pID;
 
   var lpPending = properties.get('pubStatus.pendingCampaign');
 
   var accept = properties.get('pubStatus.acceptCampaign');
 
   var approve = properties.get('pubStatus.approve');
 
   //query changed by Sonali
   var sql = "select pa.allocationID,pa.pID, pa.campID,pa.created,c.agencyID,c.clientCampID,c.campaignName,c.ABM,c.leadAllocation,pa.startDate,pa.endDate,sum(pa.allocatedLead)as allocatedLead,pa.CPL,pa.status,c.currency,c.parentCampID,c.reallocationID from campaign c join publisher_allocation pa on c.campID = pa.campID left outer join landing_page_details ld on pa.campID=ld.campID and pa.pID=ld.pID left outer join poc_details pd on pd.campID=pa.campID and pa.pID=pd.pID left outer join call_script_details cs on cs.campID=pa.campID and pa.pID=cs.pID where (pa.status= '" + lpPending + "' or (pa.status='" + accept + "' and  (ld.status!='" + approve + "' or pd.status!='" + approve + "' or cs.status!='" + approve + "'))) and pa.pID='" + pID + "' group by pa.campID desc"
 
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside pendingCampaign==>" + error);
       return res.status(400).json(errors);
     }
     else {
 
       if (results.length > 0) {
         if (results[0].pID === null) {
         } else {
           res.send(JSON.stringify(results));
         }
       }
     }
   });
 });
 
 
 /**
        * @author Supriya Gore
        * @param  Description handle the cancel publisher if status are deliver and in QA state in publisher
        * @return Description return All cancel publisher if status are deliver and in QA state in publisher
        */
 
 router.post("/getStatusForCancelPublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside getStatusForCancelPublisher");
   var errors;
   var pID = req.body.pID;
   var campID = req.body.campID;
   var leadStatus = properties.get('reviewLead.QA_Review.status');
   var AgencyInternalReview = properties.get('reviewLead.AgencyInternalReview.status');
   var ACCEPTED = properties.get('reviewLead.ACCEPTED.status');
   var Client_Accepted = properties.get('reviewLead.Client_Accepted.status');
 
   var sql = "select li.leadInfoID,li.email,li.lastUpdated,li.created,lis.status from lead_info li left join lead_info_status lis ON li.leadInfoID=lis.leadInfoID where li.campID='" + campID + "' AND li.pID='" + pID + "' AND  (lis.status='" + ACCEPTED + "' OR lis.status='" + Client_Accepted + "')";
 
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside getStatusForCancelPublisher==>" + error);
       return res.status(400).json(errors);
     }
     else {
       if (results.length > 0) {
         var checkAcceptStatus = false;
         var checkCLAcceptStatus = false;
         var checkAccept = results.filter(function (a) {
           return a.status == ACCEPTED || a.status == 'Accepted'
         })
         var checkClient = results.filter(function (a) {
           return a.status == Client_Accepted;
         })
         var acceptLength = checkAccept.length;
         var clLength = checkClient.length;
         if (checkAccept.length > 0) {
           checkAcceptStatus = true;
         } else {
           acceptLength = 0;
         }
         if (checkClient.length > 0) {
           checkCLAcceptStatus = true;
         } else {
           clLength = 0;
         }
         var resultInBoolean = [];
         //var result=true;
         resultInBoolean.push({ 'booleanResult': true, checkAcceptStatus: checkAcceptStatus, acceptStatusCount: acceptLength, checkCLAcceptStatus: checkCLAcceptStatus, clientAcceptCount: clLength });
         res.send(JSON.stringify(resultInBoolean));
         // res.send(JSON.stringify(results));
       } else {
         var resultInBoolean = [];
         //var result=true;
         resultInBoolean.push({ 'booleanResult': false, checkAcceptStatus: false, checkCLAcceptStatus: false, clientAcceptCount: 0, acceptStatusCount: 0 });
         res.send(JSON.stringify(resultInBoolean));
       }
     }
   });
 });
 
 
 
 
 /**
        * @author Supriya Gore
        * @param  Description handle the cancel publisher if status are deliver and in Accepted state
        * @return Description return All cancel publisher if status are deliver and in Accepted state
        */
 
 router.post("/getAccpetedForCancelPublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside getAccpetedForCancelPublisher");
   var errors;
   var pID = req.body.pID;
   var campID = req.body.campID;
   var allocatedLeads = req.body.allocatedLeads;
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   var active = properties.get('activeCampaign.partialAllocation');
   var allocatingInProgress = properties.get('agencyStatus.partialAllocation');
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var description=campaignTraceProperties.get('campaign.cancel.leadUpload');//Sonali-3257-get details from properties file
 
   var user = req.token;
   var pubAccetStatus = properties.get('pubStatus.acceptCampaign');
   var leadStatus = properties.get('reviewLead.accepted.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var QA_Review = properties.get('download.QA_Review.status');
 
 
   var sql = "select li.leadInfoID,li.email,li.lastUpdated,li.created,lis.status,count(status) as acceptedCount from lead_info li join lead_info_status lis ON li.leadInfoID=lis.leadInfoID where (li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status='" + QA_Review + "' or li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status='" + agencyInternalReview + "'or li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status='InternalReview')";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside getAccpetedForCancelPublisher==>" + error);
       return res.status(400).json(errors);
     }
     else {
       if (results.length > 0) {
         var updateLead = "update lead_info li join lead_info_status lis on li.leadInfoID=lis.leadInfoID set lis.status='Rejected',li.lastUpdated='" + formatted + "' where li.campID='" + campID + "' and li.pID='" + pID + "' and lis.status in ('" + agencyInternalReview + "','" + QA_Review + "','InternalReview')";
         pool.query(updateLead, function (error, leadData, fields) {
           if (error) {
             log.error("Error Inside getAccpetedForCancelPublisher==>" + error);
           }
         });
       }
       if (results[0].leadInfoID != null) {
         pool.query(
           "UPDATE campaign c, publisher_allocation pa SET pa.allocatedLead='" + results[0].acceptedCount + "',pa.status ='" + cancelALU + "',c.status='" + allocatingInProgress + "',pa.lastUpdated='" + formatted + "' WHERE c.campID=pa.campID and c.campID='" + campID + "' and pa.pID='" + pID + "'",
 
           function (error, results, fields) {
 
             if (error) {
               log.error("Error inside getAccpetedForCancelPublisher update query==>" + error);
             } else {
               var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','" + cancelALU + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
               pool.query(sql1, function (err, results, fields) {
                 if (err) { log.error("Error=" + err); }
                 else {
                 }
               });
               var user_role = 'PC';
               var user_role1 = 'AC';
               var userSql = "select ud.userName,ud.firstName,ud.lastName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE orgID='" + pID + "' and role='" + user_role + "'  and ec.cancelPublisher='" + emailConfigYes + "'";
               pool.query(userSql, function (error, userResult, fields) {
                 if (error) {
                 }
                 else {
                   var userSql1 = "select ud.userName,ud.firstName,ud.lastName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE (ud.orgID='" + user.id + "' and ud.role='" + user_role1 + "' and ec.cancelPublisher='" + emailConfigYes + "')";
                   pool.query(userSql1, function (error, userResult1, fields) {
                     if (error) {
                     }
                     else {
                       // for IO PDF generation.
                       var allocationID = '';
                       var agencyID = user.id;
                       var userData = { firstName: userResult[0].firstName, lastName: userResult[0].lastName }
                       let { timezone, timestamp } = req.body;
                       setTimeout(function () {
                         GenerateIO.generateIODocument(res, allocationID, pID, campID, userData, agencyID, fromInvoice = false, timestamp, timezone);
                       }, 3000);
 
                       var result = userResult.concat(userResult1);
 
                       email.publisherCancel(result, campID, user);
 
                       /**
                    * @author Narendra Phadke
                    * @param  Description handle the Alerts Functionality 
                    * @return Description return insert alerts
                    */
 
                       let description = propertiesNotification.get('campaign.cancel.notification');
                       let messageStatus = properties.get('Message.Unread');
                       let queryAlerts = "insert into conversation_alerts SET ?",
                         values = {
                           campID: campID,
                           agencyID: user.id,
                           pID: pID,
                           advertiserID: 0,
                           userID: user.userID,
                           sender: user.id,
                           receiver: pID,
                           description: description,
                           status: messageStatus,
                           created: formatted,
                           lastUpdated: formatted
                         };
 
                       pool.query(queryAlerts, values, function (error, results, fields) {
                         if (error) {
                           log.error("Alerts inside campaign cancel to publisher allocation Error==" + error);
                         } else {
                         }
                       });
                       //res.send(JSON.stringify(result));
                       // //
                     }
 
                   })
                 }
               })
             }
 
           });
 
         var resultInBoolean = [];
         //var result=true;
         resultInBoolean.push({ 'booleanAccept': true });
         res.send(JSON.stringify(resultInBoolean));
         // res.send(JSON.stringify(results));
         //}
       } else {
         var resultInBoolean = [];
         //var result=true;
         resultInBoolean.push({ 'booleanAccept': false });
         res.send(JSON.stringify(resultInBoolean));
 
       }
     }
   });
 });
 
 
 /**
        * @author Supriya Gore
        * @param  Description handle the cancellation of allocated leads update to campaign log
        * @return Description return All cancelled allocated leads
        */
 router.post("/cancelToPublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside cancelToPublisher");
   var pID = req.body.pID;
   var campID = req.body.campID;
   var user = req.token;//Somnath Task-3858, Get Token from req.
   var userName = "";
   var cancel = properties.get('publisher.cancelPublisher');
   var allocatingInProgress = properties.get('agencyStatus.partialAllocation');
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var description=campaignTraceProperties.get('campaign.allocation.cancel');//Sonali-3257-get details from properties file
 
 
   //Sonali-3142(Sunita's task)-added below status
   var cancel =properties.get('publisher.cancelPublisher');
   var reject =properties.get('pubStatus.rejectCampaign');
   var counterReject =properties.get('agencyStatus.rejectCounter');
 
 
 
   var sql = "select allocationID,status from publisher_allocation WHERE pID='" + pID + "' AND campID='" + campID + "'";
   pool.query(sql, function (error, pIDResult, fields) {
     if (error) {
       log.error("Error inside cancelPublisher==>" + error);
     }
     else {
       for (var i = 0; i < pIDResult.length; i++) {
         var updateSql = "UPDATE publisher_allocation SET previousStatus ='" + pIDResult[i].status + "',lastUpdated='" + formatted + "' WHERE campID='" + campID + "' and pID='" + pID + "' and allocationID='" + pIDResult[i].allocationID + "'";
         pool.query(updateSql, function (error, updateResult, fields) {
           if (error) {
             log.error("publisher.js/Error=" + error);
           }
           else {
 
           }
         })
       }
       //res.send(JSON.stringify(pIDResult));
       // //pool.end();
     }
   })
 //Sonali-3142(Sunita's task)-Added this quiery because on cancelling last allocated pulisher campaign status still reamin allocatingInProgress so it is changed to New
   var pubQuery="select distinct pID from publisher_allocation where campID='"+campID+"' and status NOT IN('"+cancel+"','"+reject+"','"+counterReject+"')"
 
   pool.query(pubQuery, function (error, pubResults, fields) {
     if (error) {
       log.error("error in editCampaignNew pub query===>" + error);
       throw error;
     }else
     {
       //Sonali=3142(Sunita)-if any other publisher other than this publisher for whome we are cancelling allocation is present then make campaign status allocatingInProgress
          if(pubResults.length>1){
           pool.query(
             "UPDATE campaign c, publisher_allocation pa SET pa.status ='" + cancel + "',c.status='" + allocatingInProgress + "',pa.lastUpdated='" + formatted + "' WHERE c.campID=pa.campID and c.campID='" + campID + "' and pa.pID='" + pID + "'",
   
             function (error, results, fields) {
   
               if (error) {
                 log.error("publisher.js/Error=" + error);
               } else {
               }
             });
         }
         else{
            //Sonali=3142(Sunita)-make campaign status new after cancelling last publisher
           pool.query(
             "UPDATE campaign c, publisher_allocation pa SET pa.status ='" + cancel + "',c.status='New',pa.lastUpdated='" + formatted + "' WHERE c.campID=pa.campID and c.campID='" + campID + "' and pa.pID='" + pID + "'",
     
             function (error, results, fields) {
     
               if (error) {
                 log.error("publisher.js/Error=" + error);
               } else {
               }
             });
 
         }
     }
   });
 
         var getPacing = "select * from publisher_pacing where campID='" + campID + "' and pID='" + pID + "'";
         pool.query(getPacing, function (error, pacingPublisherResult, fields) {
           if (error) {
             log.error("Error in cancel publisher pacing=" + error);
             return res.status(400).json(errors);
           } else {
 
             for (var r = 0; r < pacingPublisherResult.length; r++) {
               (function (t) {
 
                 var pubPacingQuery = "update publisher_pacing set ? where pubPacingID='" + pacingPublisherResult[t].pubPacingID + "'",
                   pacingValues = {
                     status: cancel,
                     lastUpdated: formatted
                   };
 
                 pool.query(pubPacingQuery, pacingValues, function (error, pacingPublisherResult1, fields) {
                   if (error) {
                     log.error("Error cancel pubisher pacing=" + error);
                   } else {
                   }
                 })
               })(r)
             }
           }
         })
         var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','" + cancel + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
         pool.query(sql1, function (err, results, fields) {
           if (err) {
             log.error("publisher.js/Error=" + err);
           }
           else {
           }
         });
         var user_role = 'PC';
         var user_role1 = 'AC';
         var userSql = "select ud.userName,ud.firstName,ud.lastName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE (ud.orgID='" + pID + "' and ud.role='" + user_role + "'  and ec.cancelPublisher='" + emailConfigYes + "') OR (ud.orgID='" + user.id + "' and ud.role='" + user_role1 + "'  and ec.cancelPublisher='" + emailConfigYes + "')  ";
         pool.query(userSql, function (error, userResult, fields) {
           if (error) {
             log.error("publisher/Error=" + error);
           }
           else {
             var userSql1 = "select ud.userName,ud.firstName,ud.lastName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE ud.orgID='" + user.id + "' and ud.role='" + user_role1 + "' and ec.cancelPublisher='" + emailConfigYes + "'";
             pool.query(userSql1, function (error, userResult1, fields) {
               if (error) {
                 log.error("Error=" + error);
               }
               else {
                 var result = userResult.concat(userResult1);
                 // for IO PDF generation.
                 var allocationID = '';
                 var agencyID = user.id;
                 var userData = [];
                 if (userResult.length > 0) {
                   userData = { firstName: userResult[0].firstName, lastName: userResult[0].lastName }
                 }
                 let { timezone, timestamp } = req.body;
                 setTimeout(function () {
                   GenerateIO.generateIODocument(res, allocationID, pID, campID, userData, agencyID, fromInvoice = false, timestamp, timezone);
                 }, 3000);
 
                 email.publisherCancel(result, campID, user);
                 /**
           * @author Narendra Phadke
           * @param  Description handle the Alerts Functionality 
           * @return Description return insert alerts
           */
 
                 let description = propertiesNotification.get('campaign.cancel.notification');
                 let messageStatus = properties.get('Message.Unread');
                 let queryAlerts = "insert into conversation_alerts SET ?",
                   values = {
                     campID: campID,
                     agencyID: user.id,
                     pID: pID,
                     advertiserID: 0,
                     userID: user.userID,
                     sender: user.id,
                     receiver: pID,
                     description: description,
                     status: messageStatus,
                     created: formatted,
                     lastUpdated: formatted
                   };
 
                 pool.query(queryAlerts, values, function (error, results, fields) {
                   if (error) {
                     log.error("Alerts inside campaign cancel to publisher allocation Error==" + error);
                   } else {
                   }
                 });
                 res.send(JSON.stringify(result));
 
               }
             })
           }
         })
     //   }
     // });
 })
 
 /**
      * @author Supriya Gore
      * @param  Description handle the increamental decremental of allocated leads update to campaign log
      * @return Description return All increamental decremental allocated leads
      */
 router.post("/updatePreviousStatus", function (req, res, next) {
   log.info("inside updatePreviousStatus");
   var pID = req.body.pID;
   var campID = req.body.campID;
   var cancel = properties.get('publisher.cancelPublisher');
   var accept = properties.get('pubStatus.acceptCampaign');
 
   var sql = "select allocationID,status from publisher_allocation WHERE pID='" + pID + "' AND campID='" + campID + "' and status NOT IN('" + cancel + "')";
   pool.query(sql, function (error, pIDResult, fields) {
     if (error) {
       log.error("Error inside updatePreviousStatus==>" + error);
     }
     else {
       for (var i = 0; i < pIDResult.length; i++) {
         var updateSql = "UPDATE publisher_allocation SET previousStatus ='" + pIDResult[0].status + "',lastUpdated='" + formatted + "' WHERE campID='" + campID + "' and pID='" + pID + "' and allocationID='" + pIDResult[0].allocationID + "'";
 
         pool.query(updateSql, function (error, updateResult, fields) {
           if (error) {
             log.error("Error inside updatePreviousStatus in update sql==>" + error);
           }
           else {
           }
         })
       }
       //res.send(JSON.stringify(pIDResult));
       // //
     }
   })
 
 
 })
 
 /**
        * @author Supriya Gore
        * @param  Description handle the increamental decremental of allocated leads update to campaign log
        * @return Description return All increamental decremental allocated leads
        */
 router.post("/allocatedLeadsToPublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside allocatedLeadsToPublisher");
   var pID = req.body.pID;
   var campID = req.body.campID;
   var cancel = properties.get('publisher.cancelPublisher');
   var accept = properties.get('pubStatus.acceptCampaign');
 
   var sql = "select sum(pa.allocatedLead) as allocatedLead,pa.pID,pa.campID,max(pa.startDate) as startDate,max(pa.endDate) as endDate,pa.CPL,c.leadAllocation,c.budget,c.CPL as campCPL,c.endDate as campEndDate from publisher_allocation pa join campaign c on c.campID=pa.campID WHERE pa.pID='" + pID + "' AND pa.campID='" + campID + "' and pa.status NOT IN('" + cancel + "')";
   pool.query(sql, function (error, pIDResult, fields) {
     if (error) {
       log.error("Error inside allocatedLeadsToPublisher==>" + error);
     }
     else {
 
       res.send(JSON.stringify(pIDResult));
       //
     }
   })
 
 
 })
 
 /**
  * @author Supriya Gore
  * @param  Description handle the decremental of allocated leads update to campaign log
  * @return Description return All decremental allocated leads
  */
 router.post("/allocatedLeadsToPublisherForDecrement",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside allocatedLeadsToPublisherForDecrement");
   var pID = req.body.pID;
   var campID = req.body.campID;
 
   var accept = properties.get('pubStatus.acceptCampaign');
 
   var sql = "select pa.allocationID,pa.allocatedLead,p.publisherName,pa.status from publisher_allocation pa join publisher p on pa.pID=p.pID WHERE pa.pID='" + pID + "' AND pa.campID='" + campID + "' order by pa.allocationID desc";
   pool.query(sql, function (error, pIDResult, fields) {
     if (error) {
       log.error("Error inside allocatedLeadsToPublisherForDecrement==>" + error);
     }
     else {
 
       res.send(JSON.stringify(pIDResult));
       //
     }
   })
 
 
 })
 
 
 
 /**
  * @author Supriya Gore
  * @param  Description handle the increment decrement of allocated leads update to campaign log
  * @return Description return All increment decrement allocated leads
  */
 router.post("/decrementPublisherLeads",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside decrementPublisherLeads");
   var decrementLeads = req.body.decrementLeads;
   var publisherDetail = req.body.publisherDetail;
   var publisherDec = req.body.publisherDec;
   var user = req.token;//Somnath Task-3761, Get token from req.
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var status = properties.get('agencyStatus.activeCampaign');
   var cancel = properties.get('publisher.cancelPublisher');
   var reject = properties.get('pubStatus.rejectCampaign');
   var rejectedCounter = properties.get('agencyStatus.rejectCounter');
 
   var allocatingStatus = properties.get('agencyStatus.partialAllocation');
   //var assignStatus=properties.get('publisher.assignPublisher');
   var cancelStatus = properties.get('publisher.cancelPublisher');
 
   var description=campaignTraceProperties.get('lead.decrement.publisherLead');//Sonali-3257-get details from properties file
 
   var decAllocateLead = parseInt(decrementLeads);
 
   for (var i = 0; i < publisherDec.length; i++) {
     (function (j) {
 
       if (decAllocateLead > 0) {
         decAllocateLead = parseInt(decAllocateLead) - parseInt(publisherDec[j].allocatedLead);
 
 
 
         if (0 < decAllocateLead || decAllocateLead > 0 || decAllocateLead == 0) {
           var sql = "Update publisher_allocation pa,campaign c set pa.allocatedLead='0' ,pa.lastUpdated='" + formatted + "',c.status='" + allocatingStatus + "',pa.status='" + cancelStatus + "' WHERE allocationID='" + publisherDec[j].allocationID + "' and c.campID='" + publisherDetail[0].campID + "'";
           pool.query(sql, function (error, result, fields) {
             if (error) {
               log.error("publisher.js/Error=" + error);
             }
             else {
               var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + publisherDetail[0].campID + "','" + user.id + "','" + publisherDetail[0].pID + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
               pool.query(sql1, function (err, results, fields) {
                 if (err) {
                   log.info("publisher.js/Error=" + err);
                 }
                 else {
                 }
               });
             }
           })
         } else {
 
 
           var sql2 = "Update publisher_allocation pa,campaign c set pa.allocatedLead='" + Math.abs(decAllocateLead) + "' ,pa.lastUpdated='" + formatted + "',c.status='" + allocatingStatus + "' WHERE allocationID='" + publisherDec[j].allocationID + "' and c.campID='" + publisherDetail[0].campID + "'";
 
           pool.query(sql2, function (error, result, fields) {
             if (error) {
               log.error("publisher.js/Error=" + error);
             }
             else {
               var sql3 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + publisherDetail[0].campID + "','" + user.id + "','" + publisherDetail[0].pID + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
               pool.query(sql3, function (err, results, fields) {
                 if (err) {
                   log.error("publisher.js/Error=" + err);
                 }
                 else {
                 }
               });
             }
           })
           // break;
           //}
         }
 
 
       }
     })(i);
 
 
   }
 
 
   var user_role = 'PC';
   var user_role1 = 'AC';
   var user_role2 = 'ANC';
   var userSql = "select ud.userName,ud.firstName,ud.lastName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE ud.orgID='" + publisherDetail[0].pID + "' and ud.role='" + user_role + "' and ec.leadsDecrement='" + emailConfigYes + "'";
   pool.query(userSql, function (error, userResult, fields) {
     if (error) {
       log.error("Error inside decrementPublisherLeads==>" + error);
     }
     else {
 
       var userSql1 = "select ud.userName,ud.firstName,ud.lastName  from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE ud.orgID='" + user.id + "' and (ud.role='" + user_role1 + "' and ec.leadsDecrement='" + emailConfigYes + "') OR (ud.role='" + user_role2 + "' and ec.leadsDecrement='" + emailConfigYes + "')";
       pool.query(userSql1, function (error, userResult1, fields) {
         if (error) {
           log.error("Error inside decrementPublisherLeads 1==>" + error);
         }
         else {
           // generate IO Document
           var allocationID = '';
           var pID = publisherDetail[0].pID;
           var campID = publisherDetail[0].campID;
           var agencyID = user.id;
           var userData = [];
           if (userResult.length > 0) {
             userData = { firstName: userResult[0].firstName, lastName: userResult[0].lastName }
           }
           let { timezone, timestamp } = req.body;
           setTimeout(function () {
             GenerateIO.generateIODocument(res, allocationID, pID, campID, userData, agencyID, fromInvoice = false, timestamp, timezone);
           }, 3000);
           var afterDecLead = parseInt(publisherDetail[0].allocatedLead) - parseInt(decrementLeads);
 
           var result = userResult.concat(userResult1);
           email.publisherDecrement(result, publisherDetail[0].campID, publisherDetail[0].allocatedLead, afterDecLead, user);
 
           /**
            * @author Narendra Phadke
            * @param  Description handle the Alerts Functionality 
            * @return Description return insert alerts
            */
 
           let description = propertiesNotification.get('campaign.decrement.notification');
           let messageStatus = properties.get('Message.Unread');
           let queryAlerts = "insert into conversation_alerts SET ?",
             values = {
               campID: publisherDetail[0].campID,
               agencyID: user.id,
               pID: publisherDetail[0].pID,
               advertiserID: 0,
               userID: user.userID,
               sender: user.id,
               receiver: publisherDetail[0].pID,
               description: description,
               status: messageStatus,
               created: formatted,
               lastUpdated: formatted
             };
 
           pool.query(queryAlerts, values, function (error, results, fields) {
             if (error) {
               log.error("Alerts inside campaign lead decrement to publisher Error==" + error);
             } else {
             }
           });
 
           if (publisherDetail[0].allocatedLead > afterDecLead) {
             var pubQuery = "select sum(allocatedLead) as allocatedLead from publisher_allocation where campID='" + publisherDetail[0].campID + "' and pID='" + publisherDetail[0].pID + "' and status NOT IN('" + cancel + "','" + rejectedCounter + "','" + reject + "')";
             pool.query(pubQuery, function (error, pubResult, fields) {
               if (error) {
                 log.error("Error Allocation select Pacing Campaign=" + error);
               } else {
 
                 var pacingPubQuery = "select pubPacingID,pacingMonth,pacingUnit,pacingPercentage,pacingLeadCount,pacingEndDate,pacingCarryForward,created from publisher_pacing where campID='" + publisherDetail[0].campID + "' and pID='" + publisherDetail[0].pID + "'";
                 pool.query(pacingPubQuery, function (error, pacingPublisherResult, fields) {
                   if (error) {
                     log.error("Error Allocation select Pacing Campaign=" + error);
                   } else {
 
                     if (pacingPublisherResult.length > 0) {
                       for (var r = 0; r < pacingPublisherResult.length; r++) {
                         (function (t) {
 
                           if (t == (pacingPublisherResult.length - 1)) {
                             var pacingLeadCount = parseInt(pubResult[0].allocatedLead) - publisherPacingLeadCount;
                             pacingPublisherResult[t].pacingLeadCount = pacingLeadCount;
 
                           } else {
                             var pacingLeadCount = parseInt(pacingPublisherResult[t].pacingPercentage) * parseInt(pubResult[0].allocatedLead) / 100;
                             pacingPublisherResult[t].pacingLeadCount = Math.round(pacingLeadCount);
                             publisherPacingLeadCount = publisherPacingLeadCount + pacingPublisherResult[t].pacingLeadCount;
                           }
 
                           var pubPacingQuery = "update publisher_pacing set ? where campID='" + publisherDetail[0].campID + "' and pID='" + publisherDetail[0].pID + "' and pacingMonth='" + pacingPublisherResult[t].pacingMonth + "'",
                             pacingValues = {
                               campID: publisherDetail[0].campID,
                               pID: publisherDetail[0].pID,
                               // allocationID:allocationID,
                               agencyID: user.id,
                               pacingMonth: pacingPublisherResult[t].pacingMonth,
                               pacingUnit: pacingPublisherResult[t].pacingUnit,
                               pacingPercentage: pacingPublisherResult[t].pacingPercentage,
                               pacingLeadCount: pacingPublisherResult[t].pacingLeadCount,
                               pacingEndDate: pacingPublisherResult[t].pacingEndDate,
                               pacingCarryForward: pacingPublisherResult[t].pacingCarryForward,
                               created: pacingPublisherResult[t].created,
                               lastUpdated: formatted
                             };
 
                           pool.query(pubPacingQuery, pacingValues, function (error, pacingPublisherResult1, fields) {
                             if (error) {
                               log.error("Error Allocation Pacing Campaign=" + error);
                             } else {
                             }
                           })
                         })(r)
                       }
                     }
 
                   }
                 })
               }
             })
             res.send(JSON.stringify(userResult));
             //
           }
         }
       })
     }
   })
 
 })
 
 /**
      * @author Supriya Gore
      * @param  Description handle the total leads increment of allocated leads update to campaign log
      * @return Description return All increment allocated leads
      */
 router.post("/incrementCampaignLeads", function (req, res, next) {
   log.info("inside incrementCampaignLeads");
   var incrementLeads = req.body.incrementLeads;
   var campaignEndDate = req.body.campaignEndDate;
   var publisherDetail = req.body.publisherDetail;
   var leadAllocation = 0;
   var budget = 0;
   var campCPL = publisherDetail[0].campCPL;
   var totalIncBudget = 0;
   var user = req.body.user;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var status = properties.get('agencyStatus.activeCampaign');
   var allocatingStatus = properties.get('agencyStatus.partialAllocation');
 
   leadAllocation = parseInt(publisherDetail[0].leadAllocation) + parseInt(incrementLeads);
 
   if (campCPL === '' || campCPL === undefined || campCPL === null) {
     var cplOfBudget = parseInt(publisherDetail[0].budget) / parseInt(publisherDetail[0].leadAllocation);
     totalIncBudget = cplOfBudget * parseInt(incrementLeads);
     campCPL = cplOfBudget;
     campCPL = campCPL.toFixed(2);
     budget = parseInt(publisherDetail[0].budget) + totalIncBudget;
   } else {
     totalIncBudget = campCPL * parseInt(incrementLeads);
     budget = parseInt(publisherDetail[0].budget) + totalIncBudget;
   }
 
   budget = budget.toFixed(2);
 
   var description=campaignTraceProperties.get('lead.increment.totalLead');//Sonali-3257-get details from properties file
 
 
   // var sql="insert into publisher_allocation (pID,campID,startDate,endDate,allocatedLead,CPL,created,lastUpdated,status) values('" +publisherDetail[0].pID +"','" +publisherDetail[0].campID +"','" +publisherDetail[0].startDate +"','" +publisherDetail[0].endDate +"','" +allocatedLead +"','" +publisherDetail[0].CPL +"','" +formatted +"','" +formatted +"','" + status +"')";
 
   //   res.locals.connection.query(sql,
   //     function(error, results, fields) {
 
   //       if (error)
   //       {
 
   //       } else {
 
   var sql = "Update campaign set leadAllocation='" + leadAllocation + "',endDate='" + campaignEndDate + "',budget='" + budget + "',CPL='" + campCPL + "',status='" + allocatingStatus + "',lastUpdated='" + formatted + "'  WHERE campID='" + publisherDetail[0].campID + "'";
   pool.query(sql, function (error, campResult, fields) {
     if (error) {
       log.error("Error inside incrementCampaignLeads==>" + error);
     }
     else {
 
 
       var sql1 = "insert into campaign_log (campID,agency_ID,status,description,user_ID,firstName,lastName,created)values('" + publisherDetail[0].campID + "','" + user.id + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
       pool.query(sql1, function (err, results, fields) {
         if (err) {
           log.error("Error=" + err);
           log.error("Error inside incrementCampaignLeads 1==>" + error);
         }
         else {
 
         }
       });
 
       res.send(JSON.stringify(campResult));
       //
     }
   })
 })
 
 
 /**
      * @author Supriya Gore
      * @param  Description handle the edit end date of allocated leads update to campaign log
      * @return Description return All edit end date allocated leads
      */
 router.post("/editEndDatePublisher",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside editEndDatePublisher");
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var endDate = req.body.endDate;
   var user = req.token;
   var publisherDetail = req.body.publisherDetail;
   var status = properties.get('agencyStatus.activeCampaign');
   var completed = properties.get('agencyStatus.completeCampaign');
   var pausedInComplete = properties.get('pubStatus.paused_incomplete');
   var liveInComplete = properties.get('pubStatus.live_incomplete');
   var acceptStatus = properties.get('pubStatus.acceptCampaign');
   let pacingDetails=[];
   var campEndDate=req.body.campEndDate;//Sonali-3176-Added campaign end date to update
   var campID=req.body.campID;//Sonali-3176-Added campaign id
   var pID=publisherDetail[0].pID;//Sonali-3176-Added pID
   pacingDetails=req.body.publisherPacingDetails;//Sonali-3176-get pacing details from FE
   var agencyID=user.id;//Sonali-3176-Added agencyID
   let detailsToInsertInCampaign=[];//Sonali-3176-Added this array to insert pacing details into campaign pacing table
   let detailsToInsertInPublisher=[];//Sonali-3176-Added this array to insert pacing details into publisher pacing table
   let keys,values;//Sonali-3176-get key values to bulk insert
   var pacingMonth=[];//Sonali-3176 to store month names
 
   var description=campaignTraceProperties.get('campaign.edit.endDate');//Sonali-3257-get details from properties file
   //Supriya, Task:3692 - added previousStatus and allocationID in query
   var pubSql = "select status,previousStatus,campID,pID,allocationID from publisher_allocation WHERE pID='" + publisherDetail[0].pID + "'and campID='" + publisherDetail[0].campID + "' AND status IN ('" + completed + "','" + pausedInComplete + "','" + liveInComplete + "')";
 
   pool.query(pubSql, function (error, publisherResult, fields) {
     if (error) {
       log.error("Error inside editEndDatePublisher pubSql==>" + error);
 
     }
     else {
      var pubResultFinal = [];  //Supriya, Task:3692 - Declaring array for add the result status from for loop
       if (publisherResult.length > 0) {
          //Sonali-3176-update campaign end date
          var updateCampaign="update campaign set endDate='"+campEndDate+"' where campID='"+campID+"'";
          pool.query(updateCampaign,function(error1,resultUpdate,fields){
            if(error1){
              log.error("error inside publisher/updatePacingDetails==>"+error1)
            }
           }) 
           //Supriya, Task:3692 - for loop for executing queryfor every allocation
           for(var p=0;p<publisherResult.length;p++){
            var sql = "Update publisher_allocation set endDate='" + endDate + "',status='" + publisherResult[p].previousStatus + "',previousStatus='"+publisherResult[p].status+"',lastUpdated='" + formatted + "'  WHERE pID='" + publisherDetail[0].pID + "'and campID='" + publisherDetail[0].campID + "' and allocationID='"+publisherResult[p].allocationID+"'";
            pool.query(sql, function (error, pubResult, fields) {
              if (error) {
                log.error("Error inside editEndDatePublisher pubResult==>" + error);
              }
              else {  
                pubResultFinal.push(pubResult);//Supriya, Task:3692 - push result array in pubResultFinal array 
              }})
          }
             var getPublisherPacingDetails="select * from publisher_pacing where campID='"+campID+"'";
             pool.query(getPublisherPacingDetails,function(err,pubPacingResult,fields){
               if(err){
                 log.error("error here==>"+err)
               }
               else{
                 if(pubPacingResult.length>0){
                   for(var i=0;i<pubPacingResult.length;i++){
                     pacingMonth.push(pubPacingResult[i].pacingMonth)
                   }
                 }
            
               //Sonali-3176-get pacing details in array to insert into table
             if(pacingDetails.length>0){
               for(var i=0;i<pacingDetails.length;i++){
                 //Sonali=3176-only get details with values 0
                 if(pacingDetails[i].pacingPercentage==0 && pacingDetails[i].pacingLeadCount==0 && (pacingMonth.includes(pacingDetails[i].pacingMonth)=="false" ||pacingMonth.includes(pacingDetails[i].pacingMonth)==false)){
                   detailsToInsertInCampaign.push({"campID":campID,"pacingMonth":pacingDetails[i].pacingMonth,"pacingUnit":pacingDetails[i].pacingUnit,"pacingPercentage":pacingDetails[i].pacingPercentage,"pacingLeadCount":pacingDetails[i].pacingLeadCount,"pacingEndDate":pacingDetails[i].pacingEndDate,"pacingCarryForward":pacingDetails[i].pacingCarryForward,"created":formatted,"lastUpdated":formatted});
 
                   detailsToInsertInPublisher.push({"campID":campID,"pID":pID,"agencyID":agencyID,"pacingMonth":pacingDetails[i].pacingMonth,"pacingUnit":pacingDetails[i].pacingUnit,"pacingPercentage":pacingDetails[i].pacingPercentage,"pacingLeadCount":pacingDetails[i].pacingLeadCount,"pacingEndDate":pacingDetails[i].pacingEndDate,"pacingCarryForward":pacingDetails[i].pacingCarryForward,"created":formatted,"lastUpdated":formatted});
                 }
               }
             } 
           
             if(detailsToInsertInCampaign.length>0){
             //Sonali-3176-get keys and values to insert into table
              keys=Object.keys(detailsToInsertInCampaign[0]);
              values=detailsToInsertInCampaign.map(obj=>keys.map(key => obj[key]));
             
            
               var sqlForCampaign='insert into pacing_campaign ('+keys.join(',')+') values ?';
               pool.query(sqlForCampaign,[values],function(err,result,fields){
                 if(err){
                   log.error("Error inside publisher/updatePacingDetails")
                 }
                 else{
                   if(detailsToInsertInPublisher.length>0){
                     keys=Object.keys(detailsToInsertInPublisher[0]);
                     values=detailsToInsertInPublisher.map(obj=>keys.map(key => obj[key]));
                        
                   var sqlForPublisher='insert into publisher_pacing ('+keys.join(',')+') values ?';
                     pool.query(sqlForPublisher,[values],function(error,result1,fields){
                       if(error){
                         log.error("Error inside publisher/updatePacingDetails")
                       }
                     })
                   }//end of detailsToInsertInPublisher.length
                 }
               })
                   
             //   }
             // })
           }//end of detailsToInsertInCampaign.length
           }
         })  
       //Sonali-Bug-3239-Generate IO document
 
                   var allocationID = '';
                   var agencyID = user.id;
                   let firstName="",lastName='';
                 
                   let { timezone, timestamp } = req.body;
                   var userData = { firstName, lastName}
                   setTimeout(function () {
                     GenerateIO.generateIODocument(res, allocationID, pID, campID, userData, agencyID, fromInvoice = false, timestamp, timezone);
                   }, 3000);
         
             var user_role = 'PC';
             var user_role1 = 'AC';
             var user_role2 = "ANC";
             var userSql = "select ud.userName from user_details ud join email_configuration ec on ud.userID=ec.userID WHERE (ud.orgID='" + publisherDetail[0].pID + "' and ud.role='" + user_role + "' and ec.endDatePublisher='" + emailConfigYes + "') OR (ud.orgID='" + user.id + "' AND ud.role='" + user_role1 + "' and ec.endDatePublisher='" + emailConfigYes + "') OR (ud.orgID='" + user.id + "' AND ud.role='" + user_role2 + "' and ec.endDatePublisher='" + emailConfigYes + "') ";
             pool.query(userSql, function (error, userResult, fields) {
               if (error) {
                 log.error("Error inside edit end date==>" + error);
 
               }
               else {
                 // var userSql1="select userName from user_details  WHERE orgID='"+user.id+"' and role='"+user_role1+"'";
                 // pool.query(userSql1,function(error, userResult1, fields) {
                 //   if (error) {
                 //     log.error("Error inside decrementPublisherLeads 1==>"+error);
 
                 //     }
                 // else{ 
 
                 email.publisherEndDate(userResult, publisherDetail[0].campID, endDate, user);
 
                 /**
            * @author Narendra Phadke
            * @param  Description handle the Alerts Functionality 
            * @return Description return insert alerts
            */
 
                 let description = propertiesNotification.get('campaign.editEndDate.notification');
                 let messageStatus = properties.get('Message.Unread');
                 let queryAlerts = "insert into conversation_alerts SET ?",
                   values = {
                     campID: publisherDetail[0].campID,
                     agencyID: user.id,
                     pID: publisherDetail[0].pID,
                     advertiserID: 0,
                     userID: user.userID,
                     sender: user.id,
                     receiver: publisherDetail[0].pID,
                     description: description,
                     status: messageStatus,
                     created: formatted,
                     lastUpdated: formatted
                   };
 
                 pool.query(queryAlerts, values, function (error, results, fields) {
                   if (error) {
                     log.error("Alerts inside campaign edit end date to publisher Error==" + error);
                   } else {
                   }
                 });
                 // }});
               }
             });
 
             var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + publisherDetail[0].campID + "','" + user.id + "','" + publisherDetail[0].pID + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
             pool.query(sql1, function (err, results, fields) {
               if (err) { log.error("Error=" + err); }
               else {
               }
             });

             //Supriya, Task:3692 - Setting time for response send
             setTimeout(function () {
             res.send(JSON.stringify(pubResultFinal));
            }, 3000);
       }
       else {
           //Sonali-3176-update campaign end date
           var updateCampaign="update campaign set endDate='"+campEndDate+"' where campID='"+campID+"'";
           pool.query(updateCampaign,function(error1,resultUpdate,fields){
             if(error1){
               log.error("error inside publisher/updatePacingDetails==>"+error1)
             }
           });
         var sql = "Update publisher_allocation set endDate='" + endDate + "',lastUpdated='" + formatted + "'  WHERE pID='" + publisherDetail[0].pID + "'and campID='" + publisherDetail[0].campID + "'";
         pool.query(sql, function (error, pubResult, fields) {
           if (error) {
             log.error("Error=" + error);
           }
           else {
 
            //Sonali-3176-get pacing details in array to insert into table
            var getPublisherPacingDetails="select * from publisher_pacing where campID='"+campID+"'";
            pool.query(getPublisherPacingDetails,function(err,pubPacingResult,fields){
              if(err){
                log.error("error here==>"+err)
              }
              else{
                if(pubPacingResult.length>0){
                  for(var i=0;i<pubPacingResult.length;i++){
                    pacingMonth.push(pubPacingResult[i].pacingMonth)
                  }
                }
            if(pacingDetails.length>0){
             for(var i=0;i<pacingDetails.length;i++){
               //Sonali=3176-only get details with values 0
               if(pacingDetails[i].pacingPercentage==0 && pacingDetails[i].pacingLeadCount==0 && (pacingMonth.includes(pacingDetails[i].pacingMonth)=="false" ||pacingMonth.includes(pacingDetails[i].pacingMonth)==false)){
 
 
                 detailsToInsertInCampaign.push({"campID":campID,"pacingMonth":pacingDetails[i].pacingMonth,"pacingUnit":pacingDetails[i].pacingUnit,"pacingPercentage":pacingDetails[i].pacingPercentage,"pacingLeadCount":pacingDetails[i].pacingLeadCount,"pacingEndDate":pacingDetails[i].pacingEndDate,"pacingCarryForward":pacingDetails[i].pacingCarryForward,"created":formatted,"lastUpdated":formatted});
 
                 detailsToInsertInPublisher.push({"campID":campID,"pID":pID,"agencyID":agencyID,"pacingMonth":pacingDetails[i].pacingMonth,"pacingUnit":pacingDetails[i].pacingUnit,"pacingPercentage":pacingDetails[i].pacingPercentage,"pacingLeadCount":pacingDetails[i].pacingLeadCount,"pacingEndDate":pacingDetails[i].pacingEndDate,"pacingCarryForward":pacingDetails[i].pacingCarryForward,"created":formatted,"lastUpdated":formatted});
               }
             }
           }    
       
           if(detailsToInsertInCampaign.length>0){
           //Sonali-3176-get keys and values to insert into table
            keys=Object.keys(detailsToInsertInCampaign[0]);
            values=detailsToInsertInCampaign.map(obj=>keys.map(key => obj[key]));
           
         
                
             var sqlForCampaign='insert into pacing_campaign ('+keys.join(',')+') values ?';
             pool.query(sqlForCampaign,[values],function(err,result,fields){
               if(err){
                 log.error("Error inside publisher/updatePacingDetails")
               }
               else{
                 if(detailsToInsertInPublisher.length>0){
                   keys=Object.keys(detailsToInsertInPublisher[0]);
                   values=detailsToInsertInPublisher.map(obj=>keys.map(key => obj[key]));
                      
 
                 var sqlForPublisher='insert into publisher_pacing ('+keys.join(',')+') values ?';
                   pool.query(sqlForPublisher,[values],function(error,result1,fields){
                     if(error){
                       log.error("Error inside publisher/updatePacingDetails")
                     }
                   })
                 }//end of detailsToInsertInPublisher.length
 
               }
             })
                 
           //   }
           // })
         }//end of detailsToInsertInCampaign.length
         }
       })
       //Sonali--Bug-3239-Generate IO document
       var allocationID = '';
       var agencyID = user.id;
       let firstName="",lastName='';
      
       let { timezone, timestamp } = req.body;
       var userData = { firstName, lastName}
       setTimeout(function () {
         GenerateIO.generateIODocument(res, allocationID, pID, campID, userData, agencyID, fromInvoice = false, timestamp, timezone);
       }, 3000);
 
             var user_role = 'PC';
             var user_role1 = 'AC';
             var user_role2 = "ANC";
             var userSql = "select ud.userName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE (ud.orgID='" + publisherDetail[0].pID + "' and ud.role='" + user_role + "' and  ec.endDatePublisher='" + emailConfigYes + "') OR (  ud.orgID='" + user.id + "' and ud.role='" + user_role1 + "' and  ec.endDatePublisher='" + emailConfigYes + "') OR (ud.orgID='" + user.id + "' AND ud.role='" + user_role2 + "' and ec.endDatePublisher='" + emailConfigYes + "')";
             pool.query(userSql, function (error, userResult, fields) {
               if (error) {
                 log.error("Error inside edit end date==>" + error);
               }
               else {
                 // var userSql1="select userName from user_details  WHERE orgID='"+user.id+"' and role='"+user_role1+"'";
                 // pool.query(userSql1,function(error, userResult1, fields) {
                 //   if (error) {
                 //     log.error("Error inside decrementPublisherLeads 1==>"+error);
 
                 //     }
                 // else{ 
 
                 email.publisherEndDate(userResult, publisherDetail[0].campID, endDate, user);
                 setTimeout(function () {
                   // IO PDF Generation
                   var getAcceptedBy = "select pa.allocationID,pa.pID,pa.acceptedBy,ud.firstName,ud.userID,ud.lastName from publisher_allocation pa     join user_details ud on ud.userID=pa.acceptedBy  where pa.pID='" + publisherDetail[0].pID + "' and pa.campID='" + publisherDetail[0].campID + "'";
                   pool.query(getAcceptedBy, function (error, pdfGen, fields) {
                     if (error) {
                       log.error("Error inside editEndDatePublisher PDF Generation==>" + error);
                     }
                     else {
                       if (pdfGen.length > 0) {
                         var allocationID = pdfGen[0].allocationID;
                         var pID = publisherDetail[0].pID;
                         var campID = publisherDetail[0].campID;
                         var agencyID = user.id;
                         let { timestamp, timezone } = req.body;
                         var userData = { userID: pdfGen[0].userID, firstName: pdfGen[0].firstName, lastName: pdfGen[0].lastName }
                         GenerateIO.generateIODocument(res, allocationID, pID, campID, userData, agencyID, fromInvoice = false, timestamp, timezone);
                       }
                     }
                   });
                 }, 2000)// End of Timeout
 
                 /**
            * @author Narendra Phadke
            * @param  Description handle the Alerts Functionality 
            * @return Description return insert alerts
            */
 
                 let description = propertiesNotification.get('campaign.editEndDate.notification');
                 let messageStatus = properties.get('Message.Unread');
                 let queryAlerts = "insert into conversation_alerts SET ?",
                   values = {
                     campID: publisherDetail[0].campID,
                     agencyID: user.id,
                     pID: publisherDetail[0].pID,
                     advertiserID: 0,
                     userID: user.userID,
                     sender: user.id,
                     receiver: publisherDetail[0].pID,
                     description: description,
                     status: messageStatus,
                     created: formatted,
                     lastUpdated: formatted
                   };
 
                 pool.query(queryAlerts, values, function (error, results, fields) {
                   if (error) {
                     log.error("Alerts inside campaign edit end date to publisher Error==" + error);
                   } else {
                   }
                 });
                 // }});
               }
             });
 
             var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + publisherDetail[0].campID + "','" + user.id + "','" + publisherDetail[0].pID + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
             pool.query(sql1, function (err, results, fields) {
               if (err) {
                 log.error("publisher.js/Error=" + err);
               }
               else {
               }
             });
 
             res.send(JSON.stringify(pubResult));
             //
           }
 
         })
       }
     }
   })
 
 })
 
 /**
 * @author Supriya Gore
 * @param  Description handle the publisher Details
 * @return Description return  publisher Details
 *///Somnath Task-3859, Add auth middleware
 router.post("/getPublisherDetails",authCheck, function (req, res, next) {
   log.info("inside getPublisherDetails");
   var pID = req.token.id;//Somnath Task-3859, Get pID from token
 
   var accept = properties.get('pubStatus.acceptCampaign');
 
   var sql = "select publisherName,pID from publisher WHERE pID='" + pID + "'";
   pool.query(sql, function (error, pIDResult, fields) {
     if (error) {
       log.error("Error inside getPublisherDetails==>" + error);
     }
     else {
 
      //  log.info("Inside else getPublisherDetails");
       res.send(JSON.stringify(pIDResult));
       //
     }
   })
 
 
 })
 
 
 /**
   * @author Somnath Keswad
   * @param  Description Accept the campaign and CPL to the selected publisher
   * @return successfully accept campaign
   */
 // router.post("/acceptNewCampaign", function (req, res, next) {
 //   log.info("inside acceptNewCampaign");
 //   var pID = req.body.pID;
 //   var user = req.body.user;
 //   var allocationID = req.body.allocationID;
 //   var campID = req.body.campaignDetail[0].campID;
 //   var clientCampID = req.body.campaignDetail[0].clientCampID;
 //   if (clientCampID == undefined || clientCampID == '' || clientCampID == null) {
 //     clientCampID = '';
 //   }
 //   var allocatedLead = req.body.allocatedLead;
 //   var userName = req.body.user;
 //   var dt = dateTime.create();
 //   var formatted = dt.format("Y-m-d H:M:S");
 //   var user_ID = req.body.user.id;
 //   var firstName = req.body.user.firstName;
 //   var lastName = req.body.user.lastName;
 //   var cancel = properties.get('publisher.cancelPublisher');
 //   var reject = properties.get('pubStatus.rejectCampaign');
 //   var rejectedCounter = properties.get('agencyStatus.rejectCounter');
 //   var cancelALU = properties.get('publisher.cancelALU_Publisher');
 //   /**
 //   * @author Narendra Phadke
 //   * @param  Description handle the Email functionality
 //   * @return Description return All Email
 //   */
 
 
 //   var campaignDetail = req.body.campaignDetail;
 //   //let data;
 //   var status = "";
 //   var description = "Campaign Accepted";
 //   var success;
 //   var errors;
 //   var user_role = "AC";
 //   var row = [];
 //   var data;
 //   var pacingArray=[];//sonali-3108-added this array to bulkinsert
 //   //get all agency details from user_details table
 //   //   res.locals.connection.query("select userID,userName,role from user_details where role='"+user_role+"' and orgID='"+campaignDetail[0].agencyID+"'",
 //   //   function(error, results, fields) {
 //   //     if (error) throw error;
 
 //   //     email.emailSend(user, results, campaignDetail, allocatedLead);
 
 //   //   }
 //   // );
 
 //   var lpStatus = properties.get('deliveryFormatStatus.yes.status');
 //   var acceptStatus = properties.get('pubStatus.acceptCampaign');
 //   var assignStatus = properties.get('agencyStatus.newAllocation');
 //   var LP_Pending = properties.get('pubStatus.pendingCampaign');
 
 //   try {
 //     //get LP details from campaign table
 //     pool.query("select requiredLPApproval,agencyID,advertiserID,leadAllocation from campaign where campID='" + campID + "'",
 //       function (error, results, fields) {
 //         if (error) {
 //           log.error("Error inside acceptNewCampaign==>" + error);
 //           throw error;
 //         }
 //         else {
 //           var agencyID = '', leadAllocation = 0;
 //           if (results.length > 0) {
 //             agencyID = results[0].agencyID;
 //             leadAllocation = results[0].leadAllocation;
 //           }
 
 //           pool.query("select status from publisher_allocation where campID='" + campID + "' and pID='" + pID + "' and status='" + acceptStatus + "'",
 //             function (error, paResults, fields) {
 //               if (error) {
 //                 log.error(error);
 //               }
 //               else {
 //                 if (paResults.length > 0) {
 //                   status = properties.get('pubStatus.acceptCampaign');
 //                 } else {
 //                   // var str=(results[0].requiredLPApproval).toString();
 //                   // if(str.includes("Landing Page")){
 
 
 
 //                   if (results[0].requiredLPApproval == "" || results[0].requiredLPApproval == "null" || results[0].requiredLPApproval == "undefined" || results[0].requiredLPApproval == undefined || results[0].requiredLPApproval == null || results[0].requiredLPApproval == "No") {
 //                     status = properties.get('pubStatus.acceptCampaign');
 
 //                     //if(results[0].requiredLPApproval===lpStatus)
 
 
 //                   } else {
 //                     status = properties.get('pubStatus.pendingCampaign');
 //                   }
 //                 }
 //                 pool.query(
 //                   "UPDATE publisher_allocation SET status ='" + status + "',acceptedBy='" + user.userID + "',lastUpdated='" + formatted + "' WHERE allocationID='" + allocationID + "'",
 
 //                   function (error, resultsData, fields) {
 
 //                     if (error) {
 //                       log.error("Error inside acceptNewCampaign 1==>" + error);
 //                       // errors.publisher = "Campaign Not Accepted";
 //                       return res.status(400).json(errors);
 
 //                     } else {
 //                       let sqlGetTotAL = "select sum(allocatedLead) as allocatedLead from publisher_allocation where campID='" + campID + "' and pID='" + pID + "' and status not in('Reject','Cancel')";
 //                       pool.query(sqlGetTotAL, (error, totAllocated, fields) => {
 //                         if (error) {
 //                           log.error("Error publisher/acceptNewCampaign:" + error);
 //                           return res.status(400).json(error);
 //                         } else {
 //                           let allocatedLead = totAllocated[0].allocatedLead;
 //                           GenerateIO.fun_countryWise_Allocation(campID, pID, allocatedLead, leadAllocation, allocationID, req, res)
 //                         }
 //                       });
 //                       success = 'Campaign accepted successfully and Insertion Order document generated';
 
 //                       var monthList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
 //                       var pacingQuery = "select pacingID,pacingMonth,pacingUnit,pacingPercentage,pacingLeadCount,pacingEndDate,pacingCarryForward from pacing_campaign where campID='" + campID + "' order by pacingEndDate";
 //                       pool.query(pacingQuery, function (error, pacingResult, fields) {
 //                         if (error) {
 //                           log.error("Error Allocation select Pacing Campaign=" + error);
 //                         } else {
 //                           var pubQuery = "select sum(allocatedLead) as allocatedLead from publisher_allocation where campID='" + campID + "' and pID='" + pID + "' and status IN('" + LP_Pending + "','" + acceptStatus + "')";
 //                           pool.query(pubQuery, function (error, pubResult, fields) {
 //                             if (error) {
 //                               log.error("Error Allocation select Pacing Campaign=" + error);
 //                             } else {
 //                               var pacingPubQuery = "select pubPacingID,pacingMonth,pacingUnit,pacingPercentage,pacingLeadCount,pacingEndDate,pacingCarryForward,created from publisher_pacing where campID='" + campID + "' and pID='" + pID + "' and status NOT IN('" + cancel + "','" + cancelALU + "') order by pacingEndDate";
 
 //                               pool.query(pacingPubQuery, function (error, pacingPublisherResult, fields) {
 //                                 if (error) {
 //                                   log.error("Error Allocation select Pacing Campaign=" + error);
 //                                 } else {
 
 //                                   var d = new Date();
 //                                   var currentMonth = d.getMonth();
 //                                   currentMonth = monthList[currentMonth];
 //                                   var currentYear = d.getFullYear()
 
 //                                   if (pacingResult.length > 0) {
 
 //                                     var publisherPacingLeadCount = 0;
 //                                     if (pacingPublisherResult.length > 0) {
 //                                       for (var r = 0; r < pacingPublisherResult.length; r++) {
 //                                         (function (t) {
 
 //                                           var paceEndDate = pacingPublisherResult[t].pacingEndDate;
 //                                           var pastDateTime = dateTime.create(paceEndDate);
 //                                           var formattedDate = pastDateTime.format("Y-m-d H:M:S");
 //                                           var pacingEndDate = new Date(formattedDate);
 
 //                                           var pacingYear = pacingEndDate.getFullYear()
 
 //                                           if (pacingYear < currentYear) {
 //                                             pubResult[0].allocatedLead = pubResult[0].allocatedLead - pacingPublisherResult[t].pacingLeadCount;
 //                                           } else {
 //                                             if (monthList.indexOf(pacingPublisherResult[t].pacingMonth) < monthList.indexOf(currentMonth)) {
 //                                               pubResult[0].allocatedLead = pubResult[0].allocatedLead - pacingPublisherResult[t].pacingLeadCount;
 //                                             } else {
 
 //                                               if (t == (pacingPublisherResult.length - 1)) {
 //                                                 var pacingLeadCount = parseInt(pubResult[0].allocatedLead) - publisherPacingLeadCount;
 //                                                 pacingPublisherResult[t].pacingLeadCount = pacingLeadCount;
 
 //                                               } else {
 //                                                 var pacingLeadCount = parseInt(pacingPublisherResult[t].pacingPercentage) * parseInt(pubResult[0].allocatedLead) / 100;
 //                                                 pacingPublisherResult[t].pacingLeadCount = Math.round(pacingLeadCount);
 //                                                 publisherPacingLeadCount = publisherPacingLeadCount + pacingPublisherResult[t].pacingLeadCount;
 //                                               }
 
 //                                               //sonali-3108-Adding this array so that we can insert in DB outside the loop
 //                                                pacingArray.push({"campID":campID,"pID":pID,"agencyID":agencyID,"pacingMonth":pacingPublisherResult[t].pacingMonth,"pacingUnit":pacingPublisherResult[t].pacingUnit,"pacingPercentage":pacingPublisherResult[t].pacingPercentage,"pacingLeadCount":pacingPublisherResult[t].pacingLeadCount,"pacingEndDate":pacingPublisherResult[t].pacingEndDate,"pacingCarryForward":pacingPublisherResult[t].pacingCarryForward,"created":pacingPublisherResult[t].created,"lastUpdated":formatted});
 
 //                                               // var pubPacingQuery = "update publisher_pacing set ? where campID='" + req.body.campID + "' and pID='" + pID + "' and pacingMonth='" + pacingPublisherResult[t].pacingMonth + "'",
 //                                               //   pacingValues = {
 //                                               //     campID: campID,
 //                                               //     pID: pID,
 //                                               //     // allocationID:allocationID,
 //                                               //     agencyID: agencyID,
 //                                               //     pacingMonth: pacingPublisherResult[t].pacingMonth,
 //                                               //     pacingUnit: pacingPublisherResult[t].pacingUnit,
 //                                               //     pacingPercentage: pacingPublisherResult[t].pacingPercentage,
 //                                               //     pacingLeadCount: pacingPublisherResult[t].pacingLeadCount,
 //                                               //     pacingEndDate: pacingPublisherResult[t].pacingEndDate,
 //                                               //     pacingCarryForward: pacingPublisherResult[t].pacingCarryForward,
 //                                               //     created: pacingPublisherResult[t].created,
 //                                               //     lastUpdated: formatted
 //                                               //   };
 
 //                                               // pool.query(pubPacingQuery, pacingValues, function (error, pacingPublisherResult1, fields) {
 //                                               //   if (error) {
 //                                               //     log.error("Error Allocation Pacing Campaign=" + error);
 //                                               //   } else {
 //                                               //   }
 //                                               // })
 //                                             }
 //                                           }
 //                                         })(r)
 //                                       }
 //                                     } 
 //                                     else {
 //                                       for (var l = 0; l < pacingResult.length; l++) {
 //                                         (function (g) {
 
 //                                           var paceEndDate = pacingResult[g].pacingEndDate;
 //                                           var pastDateTime = dateTime.create(paceEndDate);
 //                                           var formattedDate = pastDateTime.format("Y-m-d H:M:S");
 //                                           var pacingEndDate = new Date(formattedDate);
 
 //                                           var pacingYear = pacingEndDate.getFullYear()
 
 //                                           if (pacingYear < currentYear) {
 //                                             pubResult[0].allocatedLead = pubResult[0].allocatedLead - pacingResult[g].pacingLeadCount;
 //                                           } 
 //                                           else {
 
 //                                             if (monthList.indexOf(pacingResult[g].pacingMonth) < monthList.indexOf(currentMonth)) {
 //                                             } else {
 //                                               if (g == (pacingResult.length - 1)) {
 //                                                 var pacingLeadCount = parseInt(pubResult[0].allocatedLead) - publisherPacingLeadCount;
 //                                                 pacingResult[g].pacingLeadCount = pacingLeadCount;
 
 //                                               } else {
 //                                                 var pacingLeadCount = parseInt(pacingResult[g].pacingPercentage) * parseInt(pubResult[0].allocatedLead) / 100;
 //                                                 pacingResult[g].pacingLeadCount = Math.round(pacingLeadCount);
 //                                                 publisherPacingLeadCount = publisherPacingLeadCount + pacingResult[g].pacingLeadCount;
 //                                               }
 //                                               //sonali-3108-Adding this array so that we can insert in DB outside the loop
 //                                                pacingArray.push({"campID":campID,"pID":pID,"agencyID":agencyID,"pacingMonth":pacingResult[g].pacingMonth,"pacingUnit":pacingResult[g].pacingUnit,"pacingPercentage":pacingResult[g].pacingPercentage,"pacingLeadCount":pacingLeadCount,"pacingEndDate":pacingResult[g].pacingEndDate,"pacingCarryForward":pacingResult[g].pacingCarryForward,"status":acceptStatus,"created":formatted,"lastUpdated":formatted});
 
 //                                              //Sonali-putting this query in comments to remove from for loop
 
 //                                               // pubPacingQuery = "insert into publisher_pacing set ?",
 //                                               //   pacingValues = {
 //                                               //     campID: campID,
 //                                               //     pID: pID,
 //                                               //     agencyID: agencyID,
 //                                               //     pacingMonth: pacingResult[g].pacingMonth,
 //                                               //     pacingUnit: pacingResult[g].pacingUnit,
 //                                               //     pacingPercentage: pacingResult[g].pacingPercentage,
 //                                               //     pacingLeadCount: pacingResult[g].pacingLeadCount,
 //                                               //     pacingEndDate: pacingResult[g].pacingEndDate,
 //                                               //     pacingCarryForward: pacingResult[g].pacingCarryForward,
 //                                               //     status: acceptStatus,
 //                                               //     created: formatted,
                 
 //                                               //     lastUpdated: formatted
 //                                               //   };
 //                                               // pool.query(pubPacingQuery, pacingValues, function (error, pacingResult1, fields) {
 //                                               //   if (error) {
 //                                               //     log.error("Error Allocation Pacing Campaign=" + error);
 //                                               //   } else {
 //                                               //   }
 //                                               // })
 //                                             }
 //                                           }
 //                                         })(l)
 //                                       }
 //                                     }
 //                                       //sonali-3108-inserting all the records in one call out of the loop
 //                                       let keys = Object.keys(pacingArray[0]);//get keys from pacingArray
 //                                       let values= pacingArray.map( obj => keys.map( key => obj[key]));//get value from pacingArray with mapping key
 //                                       let sql = 'INSERT INTO  publisher_pacing (' + keys.join(',') + ') VALUES ?';//Insert data in publisher_pacing set
 //                                       pool.query(sql, [values], function (error, results) {
 //                                         if (error){
 //                                           log.error("Error LeadUpload/BulkInsertRejectedStatus:"+error);
 //                                         }
 //                                       });//End of sql
                                     
 
 //                                   }
 //                                 }
 //                               })
 //                             }
 //                           })
 //                         }
 //                       })
 
 //                       res.json({ success: true, message: success });
 //                       let { timestamp, timezone } = req.body;
 
 //                       GenerateIO.generateIODocument(res, allocationID, pID, campID, user, agencyID, fromInvoice = false, timestamp, timezone);
 //                       //Email commented because of they don't need email for this functionality
 //                       pool.query("select ud.userID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' and ud.orgID='" + campaignDetail[0].agencyID + "'  and ec.acceptCampaign='" + emailConfigYes + "') OR (ud.role='PC' and ud.orgID='" + pID + "'  and ec.acceptCampaign='" + emailConfigYes + "')", function (error, results, fields) {
 //                         if (error) throw error;
 //                         if (results.length > 0) {
 //                           email.emailSend(user, results, campaignDetail, allocatedLead);
 //                         }
 //                         // success = 'Campaign accepted successfully.Please close the window';
 //                         // res.json({ success: true, message: success });
 
 //                       });
 //                       //
 
 //                       /**
 //                          * @author Narendra Phadke
 //                          * @param  Description handle the Alerts Functionality 
 //                          * @return Description return insert alerts
 //                          */
 
 //                       let description = propertiesNotification.get('publisher.accept.notification');
 //                       let messageStatus = properties.get('Message.Unread');
 
 //                       let query = "insert into conversation_alerts SET ?",
 //                         values = {
 //                           campID: campID,
 //                           agencyID: results[0].agencyID,
 //                           pID: user.id,
 //                           advertiserID: 0,
 //                           userID: user.userID,
 //                           sender: user.id,
 //                           receiver: results[0].agencyID,
 //                           description: description,
 //                           status: messageStatus,
 //                           created: formatted,
 //                           lastUpdated: formatted
 //                         };
 
 //                       pool.query(query, values, function (error, results, fields) {
 //                         if (error) {
 //                           log.error("Alerts inside campaign accepted by publisher Error==" + error);
 //                         } else {
 //                         }
 //                       });
 
 //                     }
 //                   });
 
 //                 /*@author somnath keswad
 //                  * Desc Insert the record in log Table
 //                   Date:11/03/2019
 //                  */
 
 //                 var query = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + campaignDetail[0].agencyID + "','" + pID + "','" + status + "','" + description + "','" + user.userID + "','" + firstName + "','" + lastName + "','" + formatted + "')";
 //                 pool.query(query,
 //                   function (error, results, fields) {
 //                     if (error) {
 //                       log.error("Error=" + error);
 //                       return res.status(400).json(errors);
 //                     }
 //                     else { }
 //                   });
 //               }
 //             })
 //         }
 //       });//Lp tatus Fetch block end
 //   } catch (error) {
 //     errors.publisher = "Campaign Not Accepted";
 //     return res.status(400).json(errors);
 //   }
 // });
 
 
 /**
   * @author Somnath Keswad
   * @param  Description Accept the campaign and CPL to the selected publisher
   * @return successfully accept campaign
   */
  router.post("/acceptNewCampaign", authCheck,function (req, res, next) {
   log.info("inside acceptNewCampaign");
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
   var allocationID = req.body.allocationID;
   var campID = req.body.campaignDetail[0].campID;
     //Sonali-3189-Added subContracting 
   var subContracting=req.body.campaignDetail[0].subContracting;
   var clientCampID = req.body.campaignDetail[0].clientCampID;
   if (clientCampID == undefined || clientCampID == '' || clientCampID == null) {
     clientCampID = '';
   }
   var allocatedLead = req.body.allocatedLead;
   var userName = user;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var user_ID = user.id;
   var firstName = user.firstName;
   var lastName = user.lastName;
   var cancel = properties.get('publisher.cancelPublisher');
   var reject = properties.get('pubStatus.rejectCampaign');
   var rejectedCounter = properties.get('agencyStatus.rejectCounter');
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   /**
   * @author Narendra Phadke
   * @param  Description handle the Email functionality
   * @return Description return All Email
   */
 
 
   var campaignDetail = req.body.campaignDetail;
   //let data;
   var status = "";
   var success;
   var errors;
   var user_role = "AC";
   var row = [];
   var data;
   //get all agency details from user_details table
   //   res.locals.connection.query("select userID,userName,role from user_details where role='"+user_role+"' and orgID='"+campaignDetail[0].agencyID+"'",
   //   function(error, results, fields) {
   //     if (error) throw error;
 
   //     email.emailSend(user, results, campaignDetail, allocatedLead);
 
   //   }
   // );
 
   var lpStatus = properties.get('deliveryFormatStatus.yes.status');
   var acceptStatus = properties.get('pubStatus.acceptCampaign');
   var assignStatus = properties.get('agencyStatus.newAllocation');
   var LP_Pending = properties.get('pubStatus.pendingCampaign');
 
   try {
     //get LP details from campaign table
     pool.query("select requiredLPApproval,agencyID,advertiserID,leadAllocation from campaign where campID='" + campID + "'",
       function (error, results, fields) {
         if (error) {
           log.error("Error inside acceptNewCampaign==>" + error);
           throw error;
         }
         else {
           var agencyID = '', leadAllocation = 0;
           if (results.length > 0) {
             agencyID = results[0].agencyID;
             leadAllocation = results[0].leadAllocation;
           }
 
           log.info("Inside else acceptNewCampaign");
           pool.query("select status from publisher_allocation where campID='" + campID + "' and pID='" + pID + "' and status='" + acceptStatus + "'",
             function (error, paResults, fields) {
               if (error) {
                 log.error(error);
               }
               else {
                 if (paResults.length > 0) {
                   status = properties.get('pubStatus.acceptCampaign');
                 } else {
                   // var str=(results[0].requiredLPApproval).toString();
                   // if(str.includes("Landing Page")){
 
 
 
                   if (results[0].requiredLPApproval == "" || results[0].requiredLPApproval == "null" || results[0].requiredLPApproval == "undefined" || results[0].requiredLPApproval == undefined || results[0].requiredLPApproval == null || results[0].requiredLPApproval == "No") {
                     status = properties.get('pubStatus.acceptCampaign');
 
                     //if(results[0].requiredLPApproval===lpStatus)
 
 
                   } else {
                     status = properties.get('pubStatus.pendingCampaign');
                   }
                 }
                 pool.query(
                     //Sonali-3189-Added subContracting in the following query
 
                   "UPDATE publisher_allocation SET status ='" + status + "',acceptedBy='" + user.userID + "',lastUpdated='" + formatted + "',subContractingCheck='"+subContracting+"' WHERE allocationID='" + allocationID + "'",
 
                   function (error, resultsData, fields) {
 
                     if (error) {
                       log.error("Error inside acceptNewCampaign 1==>" + error);
                       // errors.publisher = "Campaign Not Accepted";
                       return res.status(400).json(errors);
 
                     } else {
                       let sqlGetTotAL = "select sum(allocatedLead) as allocatedLead from publisher_allocation where campID='" + campID + "' and pID='" + pID + "' and status not in('Reject','Cancel')";
                       pool.query(sqlGetTotAL, (error, totAllocated, fields) => {
                         if (error) {
                           log.error("Error publisher/acceptNewCampaign:" + error);
                           return res.status(400).json(error);
                         } else {
                           let allocatedLead = totAllocated[0].allocatedLead;
                           GenerateIO.fun_countryWise_Allocation(campID, pID, allocatedLead, leadAllocation, allocationID, req, res)
                         }
                       });
                       success = 'Campaign accepted successfully and Insertion Order document generated';
 
                       var monthList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
 
                       var pacingQuery = "select pacingID,pacingMonth,pacingUnit,pacingPercentage,pacingLeadCount,pacingEndDate,pacingCarryForward from pacing_campaign where campID='" + campID + "' order by pacingEndDate";
                       pool.query(pacingQuery, function (error, pacingResult, fields) {
                         if (error) {
                           log.error("Error Allocation select Pacing Campaign=" + error);
                         } else {
                           var pubQuery = "select sum(allocatedLead) as allocatedLead from publisher_allocation where campID='" + campID + "' and pID='" + pID + "' and status IN('" + LP_Pending + "','" + acceptStatus + "')";
                           pool.query(pubQuery, function (error, pubResult, fields) {
                             if (error) {
                               log.error("Error Allocation select Pacing Campaign=" + error);
                             } else {
 
                               var pacingPubQuery = "select pubPacingID,pacingMonth,pacingUnit,pacingPercentage,pacingLeadCount,pacingEndDate,pacingCarryForward,created from publisher_pacing where campID='" + campID + "' and pID='" + pID + "' and status NOT IN('" + cancel + "','" + cancelALU + "') order by pacingEndDate";
                               pool.query(pacingPubQuery, function (error, pacingPublisherResult, fields) {
                                 if (error) {
                                   log.error("Error Allocation select Pacing Campaign=" + error);
                                 } else {
 
                                   var d = new Date();
                                   var currentMonth = d.getMonth();
                                   currentMonth = monthList[currentMonth];
                                   var currentYear = d.getFullYear()
 
                                   if (pacingResult.length > 0) {
 
                                     var publisherPacingLeadCount = 0;
                                     if (pacingPublisherResult.length > 0) {
                                       for (var r = 0; r < pacingPublisherResult.length; r++) {
                                         (function (t) {
 
                                           var paceEndDate = pacingPublisherResult[t].pacingEndDate;
                                           var pastDateTime = dateTime.create(paceEndDate);
                                           var formattedDate = pastDateTime.format("Y-m-d H:M:S");
                                           var pacingEndDate = new Date(formattedDate);
 
                                           var pacingYear = pacingEndDate.getFullYear()
 
                                           if (pacingYear < currentYear) {
                                             pubResult[0].allocatedLead = pubResult[0].allocatedLead - pacingPublisherResult[t].pacingLeadCount;
                                           } else {
                                             if (monthList.indexOf(pacingPublisherResult[t].pacingMonth) < monthList.indexOf(currentMonth)) {
                                               pubResult[0].allocatedLead = pubResult[0].allocatedLead - pacingPublisherResult[t].pacingLeadCount;
                                             } else {
 
                                               if (t == (pacingPublisherResult.length - 1)) {
                                                 var pacingLeadCount = parseInt(pubResult[0].allocatedLead) - publisherPacingLeadCount;
                                                 pacingPublisherResult[t].pacingLeadCount = pacingLeadCount;
 
                                               } else {
                                                 var pacingLeadCount = parseInt(pacingPublisherResult[t].pacingPercentage) * parseInt(pubResult[0].allocatedLead) / 100;
                                                 pacingPublisherResult[t].pacingLeadCount = Math.round(pacingLeadCount);
                                                 publisherPacingLeadCount = publisherPacingLeadCount + pacingPublisherResult[t].pacingLeadCount;
                                               }
 
 
                                               var pubPacingQuery = "update publisher_pacing set ? where campID='" + req.body.campID + "' and pID='" + pID + "' and pacingMonth='" + pacingPublisherResult[t].pacingMonth + "'",
                                                 pacingValues = {
                                                   campID: campID,
                                                   pID: pID,
                                                   // allocationID:allocationID,
                                                   agencyID: agencyID,
                                                   pacingMonth: pacingPublisherResult[t].pacingMonth,
                                                   pacingUnit: pacingPublisherResult[t].pacingUnit,
                                                   pacingPercentage: pacingPublisherResult[t].pacingPercentage,
                                                   pacingLeadCount: pacingPublisherResult[t].pacingLeadCount,
                                                   pacingEndDate: pacingPublisherResult[t].pacingEndDate,
                                                   pacingCarryForward: pacingPublisherResult[t].pacingCarryForward,
                                                   created: pacingPublisherResult[t].created,
                                                   lastUpdated: formatted
                                                 };
 
                                               pool.query(pubPacingQuery, pacingValues, function (error, pacingPublisherResult1, fields) {
                                                 if (error) {
                                                   log.error("Error Allocation Pacing Campaign=" + error);
                                                 } else {
                                                 }
                                               })
                                             }
                                           }
                                         })(r)
                                       }
                                     } else {
                                       for (var l = 0; l < pacingResult.length; l++) {
                                         (function (g) {
 
                                           var paceEndDate = pacingResult[g].pacingEndDate;
                                           var pastDateTime = dateTime.create(paceEndDate);
                                           var formattedDate = pastDateTime.format("Y-m-d H:M:S");
                                           var pacingEndDate = new Date(formattedDate);
 
                                           var pacingYear = pacingEndDate.getFullYear()
 
                                           if (pacingYear < currentYear) {
                                             pubResult[0].allocatedLead = pubResult[0].allocatedLead - pacingResult[g].pacingLeadCount;
                                           } else {
 
                                             if (monthList.indexOf(pacingResult[g].pacingMonth) < monthList.indexOf(currentMonth)) {
                                             } else {
                                               if (g == (pacingResult.length - 1)) {
                                                 var pacingLeadCount = parseInt(pubResult[0].allocatedLead) - publisherPacingLeadCount;
                                                 pacingResult[g].pacingLeadCount = pacingLeadCount;
 
                                               } else {
                                                 var pacingLeadCount = parseInt(pacingResult[g].pacingPercentage) * parseInt(pubResult[0].allocatedLead) / 100;
                                                 pacingResult[g].pacingLeadCount = Math.round(pacingLeadCount);
                                                 publisherPacingLeadCount = publisherPacingLeadCount + pacingResult[g].pacingLeadCount;
                                               }
 
 
 
                                               pubPacingQuery = "insert into publisher_pacing set ?",
                                                 pacingValues = {
                                                   campID: campID,
                                                   pID: pID,
                                                   agencyID: agencyID,
                                                   pacingMonth: pacingResult[g].pacingMonth,
                                                   pacingUnit: pacingResult[g].pacingUnit,
                                                   pacingPercentage: pacingResult[g].pacingPercentage,
                                                   pacingLeadCount: pacingResult[g].pacingLeadCount,
                                                   pacingEndDate: pacingResult[g].pacingEndDate,
                                                   pacingCarryForward: pacingResult[g].pacingCarryForward,
                                                   status: acceptStatus,
                                                   created: formatted,
                                                   lastUpdated: formatted
                                                 };
                                               pool.query(pubPacingQuery, pacingValues, function (error, pacingResult1, fields) {
                                                 if (error) {
                                                   log.error("Error Allocation Pacing Campaign=" + error);
                                                 } else {
                                                 }
                                               })
                                             }
                                           }
                                         })(l)
                                       }
                                     }
 
                                   }
                                 }
                               })
                             }
                           })
                         }
                       })
 
                       res.json({ success: true, message: success });
                       let { timestamp, timezone } = req.body;
                       //Sonali-3189-Added subContracting 
                       GenerateIO.generateIODocument(res, allocationID, pID, campID, user, agencyID, fromInvoice = false, timestamp, timezone,subContracting);
                       //Email commented because of they don't need email for this functionality
                       pool.query("select ud.userID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' and ud.orgID='" + campaignDetail[0].agencyID + "'  and ec.acceptCampaign='" + emailConfigYes + "') OR (ud.role='PC' and ud.orgID='" + pID + "'  and ec.acceptCampaign='" + emailConfigYes + "')", function (error, results, fields) {
                         if (error) throw error;
                         if (results.length > 0) {
                           email.emailSend(user, results, campaignDetail, allocatedLead);
                         }
                         // success = 'Campaign accepted successfully.Please close the window';
                         // res.json({ success: true, message: success });
 
                       });
                       //
 
                       /**
                          * @author Narendra Phadke
                          * @param  Description handle the Alerts Functionality 
                          * @return Description return insert alerts
                          */
 
                       let description = propertiesNotification.get('publisher.accept.notification');
                       let messageStatus = properties.get('Message.Unread');
 
                       let query = "insert into conversation_alerts SET ?",
                         values = {
                           campID: campID,
                           agencyID: results[0].agencyID,
                           pID: user.id,
                           advertiserID: 0,
                           userID: user.userID,
                           sender: user.id,
                           receiver: results[0].agencyID,
                           description: description,
                           status: messageStatus,
                           created: formatted,
                           lastUpdated: formatted
                         };
 
                       pool.query(query, values, function (error, results, fields) {
                         if (error) {
                           log.error("Alerts inside campaign accepted by publisher Error==" + error);
                         } else {
                         }
                       });
 
                     }
                   });
 
                 /*@author somnath keswad
                  * Desc Insert the record in log Table
                   Date:11/03/2019
                  */
                 var description=campaignTraceProperties.get('campaign.publisher.accept');//Sonali-3257-get details from properties file
                 var query = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + campaignDetail[0].agencyID + "','" + pID + "','" + status + "','" + description + "','" + user.userID + "','" + firstName + "','" + lastName + "','" + formatted + "')";
                 pool.query(query,
                   function (error, results, fields) {
                     if (error) {
                       log.error("Error=" + error);
                       return res.status(400).json(errors);
                     }
                     else { }
                   });
               }
             })
         }
       });//Lp tatus Fetch block end
   } catch (error) {
     errors.publisher = "Campaign Not Accepted";
     return res.status(400).json(errors);
   }
 });
 
 
 
 /*@author somnath keswad
  * Desc In Allocate the campaign to change status Assign when fully assign the campaign to Publisher 
  @version 1.0
  Date:24/12/2018
  */
 router.get("/allocatedCampaign", function (req, res, next) {
   log.info("inside allocatedCampaign");
 
   var agencyID = url.parse(req.url, true).query.agencyID;
   var errors;
   var assign = properties.get('agencyStatus.newAllocation');
   var acceptedCounter = properties.get('agencyStatus.acceptCounter');
   var reject = properties.get('pubStatus.rejectCampaign');
   var counter = properties.get('pubStatus.counterCampaign');
   var accept = properties.get('pubStatus.acceptCampaign');
   var sql = "SELECT c.clientCampID,c.parentCampID,c.reallocationID,pa.allocationID,c.agencyID,pa.campID,pa.pID, c.startDate, c.endDate,pa.status,pa.counterLead,pa.counterCPL,p.publisherName,pa.CPL, (select (pa.allocatedLead)from publisher_allocation where pa.status='" + reject + "' and c.agencyID='" + agencyID + "' group by pa.campID)as rejectedLead, (select (pa.allocatedLead)  from publisher_allocation where pa.status='" + assign + "' and c.agencyID='" + agencyID + "' group by pa.campID)as assignLead, (select (pa.allocatedLead)  from publisher_allocation where pa.status='" + acceptedCounter + "' and c.agencyID='" + agencyID + "' group by pa.campID)as acceptCounterLead,(c.leadAllocation - (pa.allocatedLead)) AS pendingLead,c.campaignName,c.leadAllocation,c.ABM   from publisher_allocation pa join campaign c on pa.campID = c.campID  join publisher p on pa.pID=p.pID where (pa.status='" + assign + "' and c.agencyID='" + agencyID + "') OR (pa.status='" + reject + "' and c.agencyID='" + agencyID + "' ) or   (pa.status='" + counter + "' and c.agencyID='" + agencyID + "')or (pa.status='" + acceptedCounter + "' and c.agencyID='" + agencyID + "')  order by pa.campID desc, pa.status='" + reject + "' desc,pa.status='" + counter + "'desc";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside allocatedCampaign==>" + error);
       return res.status(400).json(errors);
     } else {
       log.info("Inside else allocatedCampaign");
       var sql1 = "select pa.campID,sum(pa.allocatedLead)as acceptedLead from  publisher_allocation pa join campaign c on pa.campID=c.campID where  pa.status='" + accept + "' and c.agencyID='" + agencyID + "' group by pa.campID order by pa.campID DESC";
       pool.query(sql1,
         function (error, results1, fields) {
           if (error) {
             log.error("Error inside allocatedCampaign sql1==>" + error);
             return res.status(400).json(errors);
           } else {
             let merged = [];
 
             for (let i = 0; i < results.length; i++) {
               merged.push({ ...results[i], ...(results1.find((itmInner) => itmInner.campID === results[i].campID)) }
               );
             }
 
             var sql2 = "select pa.campID,sum(pa.allocatedLead) totalAllocation,c.leadAllocation,(c.leadAllocation-sum(pa.allocatedLead))as totalPending from publisher_allocation pa join campaign c on pa.campID=c.campID where  (c.agencyID='" + agencyID + "' and pa.status='" + assign + "') or (c.agencyID='" + agencyID + "' and pa.status='" + accept + "')or (c.agencyID='" + agencyID + "' and pa.status='" + acceptedCounter + "')or (c.agencyID='" + agencyID + "' and pa.status='" + counter + "')group by pa.campID";
             pool.query(sql2,
               function (error, results2, fields) {
                 if (error) {
                   log.error("Error inside allocatedCampaign sql2==>" + error);
                   return res.status(400).json(errors);
                 } else {
                   let mergedArray = [];
 
                   for (let i = 0; i < merged.length; i++) {
                     mergedArray.push({ ...merged[i], ...(results2.find((itmInner) => itmInner.campID === merged[i].campID)) }
                     );
                   }
                   res.send(JSON.stringify(mergedArray));
                   //
                 }
               });
 
           }
         }
       );
       // res.send(JSON.stringify(results));
     }
   }
   );
   // //
 }
 );
 
 
 /**
 * @author somnath keswad
 * @param  Description getting Sum of allocated leads of all campaign in pending Allocation tab
 */
 router.get("/sumOfAllocatedLeads", function (req, res, next) {
   log.info("inside sumOfAllocatedLeads");
   var agencyID = url.parse(req.url, true).query.agencyID;
   var errors;
   var assign = properties.get('agencyStatus.newAllocation');
   var accept = properties.get('pubStatus.acceptCampaign');
   var acceptedCounter = properties.get('agencyStatus.acceptCounter');
   var counter = properties.get('pubStatus.counterCampaign');
   var pending = properties.get('pubStatus.pendingCampaign');
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   var completed = properties.get('agencyStatus.completeCampaign');
   var liveInComplete = properties.get('pubStatus.live_incomplete');
   var pausedInComplete = properties.get('pubStatus.paused_incomplete');
   var sql = "select pa.allocationID,pa.campID,sum(pa.allocatedLead)as allocatedLead,c.budget,c.agencyID from  publisher_allocation pa join campaign c  on pa.campID=c.campID join agency_details ad on ad.agencyID=c.agencyID  where   (c.agencyID='" + agencyID + "' and pa.status='Accept') or (c.agencyID='" + agencyID + "' and  pa.status='Assign') or  (c.agencyID='" + agencyID + "' and pa.status='AcceptedCounter') or   (c.agencyID='" + agencyID + "' and  pa.status='Counter') or (c.agencyID='" + agencyID + "' and  pa.status='Paused') or (c.agencyID='" + agencyID + "' and  pa.status='" + pending + "') or (c.agencyID='" + agencyID + "' and  pa.status='" + cancelALU + "') or (c.agencyID='" + agencyID + "' and  pa.status='" + completed + "')or (c.agencyID='" + agencyID + "' and  pa.status='" + liveInComplete + "')or (c.agencyID='" + agencyID + "' and  pa.status='" + pausedInComplete + "') group by pa.campID order by pa.campID DESC";
   pool.query(sql,
     function (error, results, fields) {
       if (error) {
         log.error("Error inside sumOfAllocatedLeads==>" + error);
         return res.status(400).json(errors);
       } else {
         log.info("Inside else sumOfAllocatedLeads");
         res.send(JSON.stringify(results));
         ////
       }
     }
   );
   // //
 }
 );
 
 
 
 /*@author Somnath Keswad
  * Desc get the count of Rejected Campaign And allocated campaign
  @version 1.0
   */
 router.get("/campaignCount", function (req, res, next) {
   log.info("inside campaignCount");
   var agencyID = url.parse(req.url, true).query.agencyID;
   var assign = properties.get('agencyStatus.newAllocation');
   var acceptedCounter = properties.get('agencyStatus.acceptCounter');
   var counter = properties.get('pubStatus.counterCampaign');
   var reject = properties.get('pubStatus.rejectCampaign');
   var sql = "SELECT COUNT(pa.allocationID) as assignCount  FROM publisher_allocation pa join campaign c on c.campID=pa.campID where (c.agencyID='" + agencyID + "' and pa.status='" + assign + "') or (c.agencyID='" + agencyID + "' and pa.status='" + acceptedCounter + "'); SELECT COUNT(pa.allocationID) as rejectCount  FROM publisher_allocation pa  join campaign c on pa.campID=c.campID where pa.status='" + reject + "' and c.agencyID='" + agencyID + "';SELECT COUNT(pa.allocationID) as counterCount  FROM publisher_allocation pa join campaign c on pa.campID=c.campID where pa.status='" + counter + "' and c.agencyID='" + agencyID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside campaignCount==>" + error);
       throw error;
     }
     res.send(JSON.stringify(results));
     //
   }
   );
   ////
 }
 );
 
 
 /*@author Ram Chander
  * Desc In Allocate the campaign to change status Assign when fully assign the campaign to Publisher 
  @version 1.0
  Date:24/12/2018
  */
 router.get("/liveCampaign", function (req, res, next) {
   log.info("inside liveCampaign");
   var agencyID = url.parse(req.url, true).query.agencyID;
   var errors;
   var accept = properties.get('pubStatus.acceptCampaign');
   var active = properties.get('agencyStatus.activeCampaign');
   var pause = properties.get('publisher.pausePublisher');
   var liveInComplete = properties.get('pubStatus.live_incomplete');
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
 
   var QA_Review = properties.get('download.QA_Review.status');
   var accepted = properties.get('download.accepted.status');
   var rejected = properties.get('download.rejected.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var clientAccepted = properties.get('clientReviewLead.clientAccepted.status');
   var clientRejected = properties.get('clientReviewLead.clientRejected.status');
 
   var sql = "SELECT c.clientCampID,c.parentCampID,c.reallocationID,c.requiredLeadPerAsset,pa.campID,pa.pID, c.startDate, c.endDate,DATEDIFF(c.endDate,curdate()) AS DateDiff,sum( pa.allocatedLead) as allocatedLead,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead,c.campaignName,c.timezone,c.leadAllocation,c.ABM from publisher_allocation pa join campaign c on pa.campID = c.campID  where ((pa.status='" + accept + "' and c.agencyID='" + agencyID + "') OR (pa.status='" + pause + "' and c.agencyID='" + agencyID + "') OR (pa.status='" + liveInComplete + "' and c.agencyID='" + agencyID + "') OR (pa.status='" + cancelALU + "' and c.agencyID='" + agencyID + "')) And (c.campaignStatus='" + active + "' and c.agencyID='" + agencyID + "')  group by pa.campID order by pa.campID desc";
   pool.query(sql, function (error, results, fields) {
 
     if (error) {
       log.error("Error inside liveCampaign==>" + error);
       return res.status(400).json(errors);
     } else {
       log.info("Inside else liveCampaign");
       for (var i = 0; i < results.length; i++) {//add extra one column to notify which campaign has completed the lead as per assetwise
 
         results[i].completeStatus = '';
       }
 
       //Narendra - Adding clientAccepted and clientRejected lead count because we want client count also
       var sql1 = "SELECT li.campID,Sum(CASE WHEN lis.status = '" + accepted + "' OR lis.status='" + QA_Review + "'  OR lis.status='" + clientAccepted + "' OR lis.status='" + agencyInternalReview + "' THEN 1 ELSE 0 END) as deliveredLead, Sum(CASE WHEN lis.status = '" + accepted + "' OR lis.status='" + clientAccepted + "' THEN 1 ELSE 0 END) as acceptedLead,Sum(CASE WHEN lis.status = '" + QA_Review + "'OR lis.status='" + agencyInternalReview + "' THEN 1 ELSE 0 END) as qaReviewLead,Sum(CASE WHEN lis.status ='" + rejected + "' OR lis.status='" + clientRejected + "' THEN 1 ELSE 0 END) as rejectedLead FROM lead_info li INNER JOIN lead_info_status lis ON lis.leadInfoID = li.leadInfoID join campaign c on li.campID=c.campID where agencyID='" + agencyID + "'  GROUP  BY li.campID ";
       pool.query(sql1, function (error, results1, fields) {
         if (error) {
           log.error("Error inside liveCampaign 1==>" + error);
           return res.status(400).json(errors);
         } else {
           let combineResult = [];
           for (let i = 0; i < results.length; i++) {
             combineResult.push({ ...results[i], ...(results1.find((itmInner) => itmInner.campID === results[i].campID)) });
           }
           var sql2 = "select lf.campID,sd.supportDocID, lf.pID, lf.leadInfoID,lf.assetName,count(lf.leadInfoID) as leadInfoCount,c.leadAllocation,sd.leadPerAsset as leadCountPerAsset,c.requiredLeadPerAsset from lead_info lf join lead_info_status ls on ls.leadInfoID=lf.leadInfoID join campaign c on lf.campID=c.campID join supporting_document sd on sd.campID=lf.campID and sd.suppDocName=lf.assetName where (ls.status='Accepted' and c.agencyID='" + agencyID + "') or (ls.status='" + clientAccepted + "' and c.agencyID='" + agencyID + "') group by sd.supportDocID";
           pool.query(sql2, function (error, leadResults, fields) {
             if (error) {
               log.error("Error=" + error);
               return res.status(400).json(errors);
             } else {
               var suppDocID = [];
               for (var i = 0; i < leadResults.length; i++) {
                 suppDocID.push(leadResults[i].supportDocID)
               } if (suppDocID.length == 0) { suppDocID = [0] }
               var sql3 = "select sd.campID,sd.supportDocID,sd.suppDocName,sd.leadPerAsset as leadCountPerAsset,c.requiredLeadPerAsset from supporting_document sd join campaign c on c.campID=sd.campID where c.agencyID='" + agencyID + "' and sd.supportDocID NOT IN (?) and  (sd.status!='Removed' or sd.status is null)";
               pool.query(sql3, [suppDocID], function (error, leadResult1, fields) {
                 if (error) {
                   log.error("Error=" + error);
                   return res.status(400).json(errors);
                 } else {
                   var leadResult = [];
                   leadResult = leadResults.concat(leadResult1);
                   for (var i = 0; i < combineResult.length; i++) {
                     var campID = combineResult[i].campID;
                     var data = leadResult.filter(function (a) {
                       // return campID.includes(answer);
                       return a.campID == campID
                     });
                     var isComplete = false;
                     for (var j = 0; j < data.length; j++) {
                       if (data[j].leadInfoCount >= data[j].leadCountPerAsset) {
                         isComplete = true;
                       } else {
                         isComplete = false;
                       }
                     }
                     combineResult[i].completeStatus = isComplete;
                   }
                   res.send(JSON.stringify(combineResult));
                 }
               });
 
             }
           });
           // 
         }
       });
       //res.send(JSON.stringify(results));
     }
   });
   ////
 });
 
 
 
 
 /*@author Narendra Phadke
  * Desc In get paused campaign 
  @version 1.0
  */
 router.get("/pausedCampaign", function (req, res, next) {
   log.info("inside pausedCampaign");
   var agencyID = url.parse(req.url, true).query.agencyID;
   var errors;
   var pause = properties.get('agencyStatus.pauseCampaign')
   var accept = properties.get('pubStatus.acceptCampaign');
   var pausedInComplete = properties.get('pubStatus.paused_incomplete');
   pool.query("SELECT c.clientCampID,c.parentCampID,c.reallocationID,pa.campID,pa.pID, c.startDate, c.endDate, sum( pa.allocatedLead) as allocatedLead,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead,c.campaignName,c.timezone,c.leadAllocation,c.ABM from publisher_allocation pa join campaign c on pa.campID = c.campID  where c.campaignStatus='" + pause + "' and (pa.status='" + pause + "' or pa.status='" + pausedInComplete + "' ) and c.agencyID='" + agencyID + "' group by pa.campID order by pa.campID desc ",
     function (error, results, fields) {
       if (error) {
         log.error("Error In get pausedCampaign" + error);
 
         return res.status(400).json(errors);
       } else {
         res.send(JSON.stringify(results));
         //pool.end();
       }
     });
   ////pool.end();
 });
 
 
 /*@author somnath keswad
  * Desc In Allocate the campaign to change status Assign when fully assign the campaign to Publisher
  @version 1.0
   */
 router.get("/liveCampaignInPublisher", function (req, res, next) {
   log.info("inside liveCampaignInPublisher");
   var pID = url.parse(req.url, true).query.pID;
   var errors;
   var accept = properties.get('pubStatus.acceptCampaign');
   //var pause=properties.get('agencyStatus.pauseCampaign')
   var active = properties.get('agencyStatus.activeCampaign');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var clientAccepted = properties.get('clientReviewLead.clientAccepted.status');
   var sql = "SELECT c.clientCampID,c.agencyID,pa.pID,c.parentCampID,c.reallocationID,c.currency,pa.campID,pa.pID, pa.startDate, pa.endDate,DATEDIFF(pa.endDate,curdate()) AS DateDiff,  sum(pa.allocatedLead) As allocatedLead,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead, c.campaignName,c.timezone,c.leadAllocation,c.requiredLPApproval,c.ABM,pa.CPL,c.requiredLeadPerAsset from publisher_allocation pa join campaign c on pa.campID = c.campID  join user_mapping um on um.pID=pa.pID and c.agencyID=um.agencyID  where  pa.lastUpdated in (select MAX(pa.lastUpdated) from publisher_allocation pa  group by pa.lastUpdated) and (pa.pID='" + pID + "' AND pa.status='" + accept + "' AND c.campaignStatus='" + active + "' ) and pa.allocatedLead>0  group by pa.campID order by pa.campID desc";
   pool.query(sql, [pID], function (error, results, fields) {
     if (error) {
       log.error("Error inside liveCampaignInPublisher==>" + error);
       return res.status(400).json(errors);
     }
     else {
 
       var sql1 = "select lf.campID,sd.supportDocID, lf.pID, lf.leadInfoID,lf.assetName,count(lf.leadInfoID) as leadInfoCount,c.leadAllocation,sd.leadPerAsset as leadCountPerAsset,c.requiredLeadPerAsset ,   if(count(lf.leadInfoID)>=sd.leadPerAsset,sd.leadPerAsset,count(lf.leadInfoID)) as acceptedLeadsPerAsset,sd.leadPercentage  from lead_info lf join lead_info_status ls on ls.leadInfoID=lf.leadInfoID join campaign c on    lf.campID=c.campID join supporting_document sd on sd.campID=lf.campID and sd.suppDocName=lf.assetName where (ls.status='Accepted' and  lf.pID='" + pID + "') or (ls.status='" + clientAccepted + "' and  lf.pID='" + pID + "')  or (ls.status='" + agencyInternalReview + "' and  lf.pID='" + pID + "') group by sd.supportDocID";
       pool.query(sql1, function (error, leads, fields) {
         if (error) {
           log.error("Error inside liveCampaignInPublisher 1==>" + error);
 
           return res.status(400).json(errors);
         }
         else {
           for (var i = 0; i < results.length; i++) {
             var allocatedLead = parseInt(results[i].allocatedLead)
             var totAcceptedLead = 0;
             var assetLeads = 0.0;
             var leadInfoCount = 0;
             for (var j = 0; j < leads.length; j++) {
               if (leads[j].pID == results[i].pID && leads[j].campID == results[i].campID) {
                 var leadPercentage = parseFloat(leads[j].leadPercentage);
                 var aLead = allocatedLead * leadPercentage / 100;
                 assetLeads = assetLeads + parseFloat(aLead);
                 totAcceptedLead = totAcceptedLead + parseFloat(leads[j].acceptedLeadsPerAsset);
                 leadInfoCount = parseFloat(leads[j].leadInfoCount);
                 leadInfoCount = leadInfoCount + leadInfoCount;
               }
             }
             // results[i].totAcceptedLead=totAcceptedLead
             if (leadInfoCount >= assetLeads) {
               results[i].totAcceptedLead = Math.round(assetLeads);
             } else {
               results[i].totAcceptedLead = Math.round(totAcceptedLead);
             }
           }
 
           res.send(JSON.stringify(results));
           //
         }
       });
     }
   });
   //  //
 });
 
 
 /*@author Narendra Phadke
  * Desc In Paused campaign list
  @version 1.0
  Date:24/12/2018
  */ router.get("/pausedCampaignInPublisher", function (req, res, next) {
   log.info("inside pausedCampaignInPublisher");
   var pID = url.parse(req.url, true).query.pID;
   var errors;
   var status = "Accept";
   var pause = properties.get('agencyStatus.pauseCampaign');
   var cancel = properties.get('agencyStatus.cancel')
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var clientAcceptedStatus = properties.get('clientReviewLead.clientAccepted.status');
   //var status1 = "Assign";
   pool.query(
     "SELECT c.clientCampID,c.agencyID,c.parentCampID,c.reallocationID,c.requiredLeadPerAsset,pa.campID,pa.pID, pa.startDate, pa.endDate,  sum(pa.allocatedLead) As allocatedLead,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead, c.campaignName,c.timezone,c.leadAllocation,c.ABM from publisher_allocation pa join campaign c on pa.campID = c.campID  join user_mapping um on um.pID=pa.pID and c.agencyID=um.agencyID where  pa.lastUpdated in (select MAX(pa.lastUpdated) from publisher_allocation pa  group by pa.lastUpdated) and ((pa.pID='" + pID + "' and pa.status='" + pause + "') or (pa.pID='" + pID + "' and  c.campaignStatus='" + pause + "' )) and pa.status NOT IN('" + cancel + "')  group by pa.campID order by pa.campID desc ", [pID],
     function (error, results, fields) {
       if (error) {
         log.error("Error inside pausedCampaignInPublisher==>" + error);
         return res.status(400).json(errors);
       }
       else {
 
         var sql1 = "select lf.campID,sd.supportDocID, lf.pID, lf.leadInfoID,lf.assetName,count(lf.leadInfoID) as leadInfoCount,c.leadAllocation,sd.leadPerAsset as leadCountPerAsset,c.requiredLeadPerAsset ,   if(count(lf.leadInfoID)>=sd.leadPerAsset,sd.leadPerAsset,count(lf.leadInfoID)) as acceptedLeadsPerAsset,sd.leadPercentage  from lead_info lf join lead_info_status ls on ls.leadInfoID=lf.leadInfoID join campaign c on    lf.campID=c.campID join supporting_document sd on sd.campID=lf.campID and sd.suppDocName=lf.assetName where (ls.status='Accepted' and  lf.pID='" + pID + "') or (ls.status='" + clientAcceptedStatus + "' and  lf.pID='" + pID + "') or (ls.status='" + agencyInternalReview + "' and  lf.pID='" + pID + "') group by sd.supportDocID";
         pool.query(sql1, function (error, leads, fields) {
           if (error) {
             log.error("Error inside pausedCampaignInPublisher 1==>" + error);
 
             return res.status(400).json(errors);
           }
           else {
             for (var i = 0; i < results.length; i++) {
               var allocatedLead = parseInt(results[i].allocatedLead)
               var totAcceptedLead = 0;
               var assetLeads = 0;
               var leadInfoCount = 0;
               for (var j = 0; j < leads.length; j++) {
                 if (leads[j].pID == results[i].pID && leads[j].campID == results[i].campID) {
                   var leadPercentage = parseFloat(leads[j].leadPercentage);
                   var aLead = allocatedLead * leadPercentage / 100;
                   assetLeads = assetLeads + parseFloat(aLead);
                   totAcceptedLead = totAcceptedLead + parseFloat(leads[j].acceptedLeadsPerAsset);
                   leadInfoCount = parseFloat(leads[j].leadInfoCount);
                   leadInfoCount = leadInfoCount + leadInfoCount;
                 }
               }
               // results[i].totAcceptedLead=totAcceptedLead
               if (leadInfoCount >= assetLeads) {
                 results[i].totAcceptedLead = Math.round(assetLeads);
               } else {
                 results[i].totAcceptedLead = Math.round(totAcceptedLead);
               }
             }
             res.send(JSON.stringify(results));
             //
           }
         }); ////
       }
     });
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Details from database
  * @return Description return successfully send response to react page
  */
 router.get("/campaignBriefDetails", function (req, res, next) {
   log.info("inside campaignBriefDetails");
   //var campID = req.body.campID;
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.userID;
   var fromCancelTab = url.parse(req.url, true).query.cancelTab;
   let key = url.parse(req.url, true).query.key;
   var cancel = properties.get('agencyStatus.cancel');
   var cancelCampaign = properties.get('agencyStatus.campaignStatus.cancelCampaign')
 
   // select c.campID,c.clientCampID,c.campaignName,c.clientName,c.jobTitle,c.jobLevel,c.jobFunction,c.industry,c.campaignStatus,c.region,c.country,c.startDate,c.endDate,c.timezone,c.leadAllocation,c.ABM,c.campaignReportingDay,c.leadDeliveryOption,c.pacing,c.pacingLeadAllocation,c.insertionOrder,c.marketingChannel,c.otherSpecs,c.noOfLeadPerDomain ,c.createdByCompanyName,c.status,c.created,c.lastUpdated,c.budget,c.currency,c.employeeSize,c.leadDeliveryFileName,c.industryFileName,c.agencyID,c.companyRevenue,c.lpTimeline, pa.endDate as publisherassignendDate from campaign c join publisher_allocation pa WHERE  pa.lastUpdated=(select max(pa.lastUpdated) from publisher_allocation pa)  and c.campID = ? group by c.campID ",allocatedLead
 
 //Supriya, Task:3091 - query changed for get customQuestionAliasName value
 //Somnath Task-3604 add excludedIndustryFlag,excludedIndustryFileName
 //Somnath Task-3670, Add city,state,zipCode
 
   if (fromCancelTab == "Cancel") {
       //Sonali-3189-Added subContracting in the following query
       //Sonali-3798-Added biddingType in the following query
     var sql = "select c.campID,parentCampID,reallocationID,c.clientCampID,c.campaignName,c.requiredLPApproval,c.multiTouch,c.clientName,c.callAudit,c.jobTitle,c.jobLevel,c.jobFunction,c.customJobFunction,c.industry,c.customIndustry,c.campaignStatus,c.region,c.country,c.stateFileName,c.state,c.city,c.zipCode,c.cityFileName,c.zipCodeFileName,c.timezone,c.ABM,c.campaignReportingDay,c.leadDeliveryOption,c.pacing,c.pacingLeadAllocation,c.insertionOrder,c.marketingChannel,c.otherSpecs,c.noOfLeadPerDomain ,c.createdByCompanyName,c.status,c.created,c.lastUpdated,c.budget,c.currency,c.requiredLeadPerAsset,c.employeeSize,c.leadDeliveryFileName,c.industryFileName,c.agencyID,c.companyRevenue,c.lpTimeline,c.customEmpSize,c.customCompRevenue, sum(CASE WHEN pa.status='Cancel' THEN pa.allocatedLead ELSE 0 END ) As allocatedLead,pa.startDate, max(pa.endDate) as endDate,pa.status as publisherStatus, max(pa.firstLeadDeliveryDate) as firstLeadDeliveryDate,c.customJobFunction,c.customJobLevel,c.leadInteractionDays,c.creativeApprovalRequiredFor,c.requiredCountryWiseAllocation,rd.biddingType,c.customQuestionAliasName,c.subContracting,c.excludedDomain,c.excludedIndustryFlag,c.excludedIndustryFileName from campaign c left join rfp_bidding_detail rd on rd.campID=c.rfpProposalID join publisher_allocation pa on c.campID=pa.campID WHERE c.campID = ? and pa.pID='" + pID + "' and (pa.status='" + cancel + "' OR c.campaignStatus='" + cancelCampaign + "') group by c.campID"
   }
   else {
     if (key == "Assign") {
         //Sonali-3189-Added subContracting in the following query
         //Sonali-3798-Added biddingType in the following query
       var sql = "select c.campID,parentCampID,reallocationID,c.clientCampID,c.campaignName,c.requiredLPApproval,c.multiTouch,c.clientName,c.callAudit,c.jobTitle,c.jobLevel,c.jobFunction,c.customJobFunction,c.industry,c.customIndustry,c.campaignStatus,c.region,c.country,c.stateFileName,c.state,c.city,c.zipCode,c.cityFileName,c.zipCodeFileName,c.timezone,c.ABM,c.campaignReportingDay,c.leadDeliveryOption,c.pacing,c.pacingLeadAllocation,c.insertionOrder,c.marketingChannel,c.otherSpecs,c.noOfLeadPerDomain ,c.createdByCompanyName,c.status,c.created,c.lastUpdated,c.budget,c.currency,c.requiredLeadPerAsset,c.employeeSize,c.leadDeliveryFileName,c.industryFileName,c.agencyID,c.companyRevenue,c.lpTimeline,c.customEmpSize,c.customCompRevenue, sum(CASE WHEN pa.status in ('Assign') THEN pa.allocatedLead ELSE 0 END ) As allocatedLead,pa.startDate, max(pa.endDate) as endDate,pa.status as publisherStatus, max(pa.firstLeadDeliveryDate) as firstLeadDeliveryDate,c.customJobFunction,c.customJobLevel,c.leadInteractionDays,c.creativeApprovalRequiredFor,c.requiredCountryWiseAllocation,rd.biddingType,c.customQuestionAliasName,c.subContracting,c.excludedDomain,c.excludedIndustryFlag,c.excludedIndustryFileName from campaign c left join rfp_bidding_detail rd on rd.campID=c.rfpProposalID join publisher_allocation pa on c.campID=pa.campID WHERE c.campID = ? and pa.pID='" + pID + "' and pa.status NOT IN('" + cancel + "') group by c.campID"
     } else {
         //Sonali-3189-Added subContracting in the following query
         //Sonali-3798-Added biddingType in the following query
     
       var sql = "select c.campID,parentCampID,reallocationID,c.clientCampID,c.campaignName,c.requiredLPApproval,c.multiTouch,c.clientName,c.callAudit,c.jobTitle,c.jobLevel,c.jobFunction,c.customJobFunction,c.industry,c.customIndustry,c.campaignStatus,c.region,c.country,c.stateFileName,c.cityFileName,c.state,c.city,c.zipCode,c.zipCodeFileName,c.timezone,c.ABM,c.campaignReportingDay,c.leadDeliveryOption,c.pacing,c.pacingLeadAllocation,c.insertionOrder,c.marketingChannel,c.otherSpecs,c.noOfLeadPerDomain ,c.createdByCompanyName,c.status,c.created,c.lastUpdated,c.budget,c.currency,c.requiredLeadPerAsset,c.employeeSize,c.leadDeliveryFileName,c.industryFileName,c.agencyID,c.companyRevenue,c.lpTimeline,c.customEmpSize,c.customCompRevenue, sum(CASE WHEN pa.status not in ('Assign','Cancel') THEN pa.allocatedLead ELSE 0 END ) As allocatedLead,pa.startDate, max(pa.endDate) as endDate,pa.status as publisherStatus, max(pa.firstLeadDeliveryDate) as firstLeadDeliveryDate,c.customJobFunction,c.customJobLevel,c.leadInteractionDays,c.creativeApprovalRequiredFor,c.requiredCountryWiseAllocation,rd.biddingType,c.customQuestionAliasName,c.subContracting,c.excludedDomain,c.excludedIndustryFlag,c.excludedIndustryFileName from campaign c left join rfp_bidding_detail rd on rd.campID=c.rfpProposalID join publisher_allocation pa on c.campID=pa.campID WHERE c.campID = ? and pa.pID='" + pID + "' and pa.status NOT IN('" + cancel + "') group by c.campID"

     
     }
 
   }
   //added firstLeadDeliveryDate-Sonali //added publisherStatus:-Raunak 
   pool.query(sql, [campID], function (error, results, fields) {
     if (error) {
       log.error("Error inside campaignBriefDetails==>" + error);
       throw error;
     } else {
 
       if (results.length > 0) {
         results[0].customJobFunction = unescape(results[0].customJobFunction);
         results[0].customJobLevel = unescape(results[0].customJobLevel);
 
         if (results[0].leadInteractionDays == null || results[0].leadInteractionDays == undefined || results[0].leadInteractionDays == '' || results[0].leadInteractionDays == 'undefined') {
           results[0].leadInteractionDays = '';
         }
         let { jobLevel, jobFunction, customJobFunction, customJobLevel } = results[0];
         jobLevel = jobLevel || "";
         customJobLevel = customJobLevel || "";
         if (customJobLevel.charAt(0) === '|') {
           customJobLevel = customJobLevel.substr(1);
         }
         jobLevel = jobLevel + "|" + customJobLevel;
         if (jobLevel.charAt(0) === '|') {
           jobLevel = jobLevel.substr(1);
         }
         jobLevel = jobLevel || "";
         results[0].jobLevel = jobLevel;
         // JobFunction Concat
         jobFunction = jobFunction || "";
         customJobFunction = customJobFunction || "";
         if (customJobFunction.charAt(0) === '|') {
           customJobFunction = customJobFunction.substr(1);
         }
         jobFunction = jobFunction + "|" + customJobFunction;
         if (jobFunction.charAt(0) === '|') {
           jobFunction = jobFunction.substr(1);
         }
         jobFunction = jobFunction || "";
         results[0].jobFunction = jobFunction;
       }
       res.send(JSON.stringify(results));
     }
   }
   );
   ////
 });
 
 
 
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Delivery Details from database
  * @return Description return successfully send response to react page
  */
 //Somnath Task-3851, Add authcheck middleware
 router.get("/campaignBriefDeliveryDetails",authCheck, function (req, res, next) {
   log.info("inside campaignBriefDeliveryDetails");
   var campID = url.parse(req.url, true).query.campID;
   var parentCampID = url.parse(req.url, true).query.parentCampID;//Somnath Task-3128, get ParentCampID from url
   var allocationID = url.parse(req.url, true).query.reallocationID;//Somnath Task-3128, get reallocation from url
   let sql=`select * from delivery_format WHERE campID =${campID}`;
   pool.query(sql,function (error, results) {
       if (error){
         log.error("Error Publisher/campaignBriefDeliveryDetails::");
         throw error;
       }else{
         //Somnath Task-3128, generate lead Delivery URL based on delivery format
         if (results.length > 0) {
           let alternatePhoneNo = '', linkedInJobTitle = "", jobTitle = '', jobLevel = '', jobFunction = '', companyRevenue = '', companyEmployeeSize = '', industry = '', assetName = '', assetID = '', assetNameTouch1 = '', assetNameTouch2 = '', assetNameTouch3 = '', assetTimestampTouch1 = '', assetTimestampTouch2 = '', assetTimestampTouch3 = '', linkedIn = '', comments = '', domain = '', ip = '', extra1 = '', extra2 = '', extra3 = '', extra4 = '', extra5 = '', allocationIDData = '', street = '',extra6='',extra7='',extra8='',extra9='',extra10='',extra11='',extra12='',extra13='',extra14='',extra15='',extra16='',extra17='',extra18='',extra19='',extra20='';
 
           if (results[0].alternatePhoneNo === 'Yes') {
             alternatePhoneNo = '&ALTPH=""';
           }
           if (results[0].jobTitle === 'Yes') {
             jobTitle = '&jobTitle=""';
           }
           if (results[0].linkedInJobTitle === 'Yes') {
             linkedInJobTitle = '&linkedInJobTitle=""';
           }
           if (results[0].jobLevel === 'Yes') {
             jobLevel = '&jobLevel=""';
           }
           if (results[0].jobFunction === 'Yes') {
             jobFunction = '&jobFunction=""';
           }
           if (results[0].companyRevenue === 'Yes') {
             companyRevenue = '&revenue=""';
           }
           if (results[0].companyEmployeeSize === 'Yes') {
             companyEmployeeSize = '&companySize=""';
           }
           if (results[0].industry === 'Yes') {
             industry = '&industry=""';
           }
           if (results[0].assetName === 'Yes') {
             if (results[0].assetNameTouch1 === 'Yes' || results[0].assetNameTouch2 === 'Yes' || results[0].assetNameTouch3 === 'Yes') { }
             else {
               assetName = '&assetName=""';
             }
           }
           if (results[0].assetNameTouch1 === 'Yes') {
             assetNameTouch1 = '&assetNameTouch1=""';
           }
           if (results[0].assetTimestampTouch1 === 'Yes') {
             assetTimestampTouch1 = '&assetTimestampTouch1=""';
           }
           if (results[0].assetNameTouch2 === 'Yes') {
             assetNameTouch2 = '&assetNameTouch2=""';
           }
           if (results[0].assetTimestampTouch2 === 'Yes') {
             assetTimestampTouch2 = '&assetTimestampTouch2=""';
           }
           if (results[0].assetNameTouch3 === 'Yes') {
             assetNameTouch3 = '&assetNameTouch3=""';
           }
           if (results[0].assetTimestampTouch3 === 'Yes') {
             assetTimestampTouch3 = '&assetTimestampTouch3=""';
           }
           if (results[0].supportDocID === 'Yes') {
             assetID = '&assetID=""';
           }
           if (results[0].linkedIn === 'Yes') {
             linkedIn = '&linkedIn=""';
           }
           if (results[0].comments === 'Yes') {
             comments = '&comments=""';
           }
           if (results[0].domain === 'Yes') {
             domain = '&domain=""';
           }
           if (results[0].ip === 'Yes') {
             ip = '&ip=""';
           }
           if (results[0].extra1 === 'Yes') {
             extra1 = '&extra1=""';
           }
           if (results[0].extra2 === 'Yes') {
             extra2 = '&extra2=""';
           }
           if (results[0].extra3 === 'Yes') {
             extra3 = '&extra3=""';
           }
           if (results[0].extra4 === 'Yes') {
             extra4 = '&extra4=""';
           }
           if (results[0].extra5 === 'Yes') {
             extra5 = '&extra5=""';
           }
           //Somnath Task-3137, Add Extra Fields 6-20
           if (results[0].extra6 === 'Yes') {
             extra6 = '&extra6=""';
           }
           if (results[0].extra7 === 'Yes') {
             extra7 = '&extra7=""';
           }
           if (results[0].extra8 === 'Yes') {
             extra8 = '&extra8=""';
           }
           if (results[0].extra9 === 'Yes') {
             extra9 = '&extra9=""';
           }
           if (results[0].extra10 === 'Yes') {
             extra10 = '&extra10=""';
           }
           if (results[0].extra11 === 'Yes') {
             extra11 = '&extra11=""';
           }
           if (results[0].extra12 === 'Yes') {
             extra12 = '&extra12=""';
           }
           if (results[0].extra13 === 'Yes') {
             extra13 = '&extra13=""';
           }
           if (results[0].extra14 === 'Yes') {
             extra14 = '&extra14=""';
           }
           if (results[0].extra15 === 'Yes') {
             extra15 = '&extra15=""';
           }
           if (results[0].extra16 === 'Yes') {
             extra16 = '&extra16=""';
           }
           if (results[0].extra17 === 'Yes') {
             extra17 = '&extra17=""';
           }
           if (results[0].extra18 === 'Yes') {
             extra18 = '&extra18=""';
           }
           if (results[0].extra19 === 'Yes') {
             extra19 = '&extra19=""';
           }
           if (results[0].extra20 === 'Yes') {
             extra20 = '&extra20=""';
           }
           if (results[0].reAllocationID === 'Yes') {
             allocationIDData = '&allocationID=' + allocationID;
           }
           if (results[0].street === 'Yes') {
             street = '&street=""';
           }
           let deliveryURL = 'https://login.demandintegrate.com/leadAPIURL?campID=' + parentCampID + '&pID=""&LIDT=MM/DD/YYYY&email=""&fname=""&lname=""&ADD=""&WP=""' + alternatePhoneNo + '&city=""&state=""&zipcode=""&country=""&companyName=""&linkedInCompanyName=""' + street + jobTitle + linkedInJobTitle + jobLevel + jobFunction + companyRevenue + companyEmployeeSize + industry + assetName + assetNameTouch1 + assetTimestampTouch1 + assetNameTouch2 + assetTimestampTouch2 + assetNameTouch3 + assetTimestampTouch3 + assetID + allocationIDData + linkedIn + comments + domain + ip + extra1 + extra2 + extra3 + extra4 + extra5+extra6+extra7+extra8+extra9+extra10+extra11+extra12+extra13+extra14+extra15+extra16+extra17+extra18+extra19+extra20;
           results[0].deliveryURL = deliveryURL;
           res.send(JSON.stringify(results));
         } else {
           res.send(JSON.stringify(results));
         }
       }
     });
 });
 
 
 // /**
 //  * @author Supriya Gore
 //  * @param  Description Check LP Approved and POC upload and update status of publisher
 //  * @return Description return update status of publisher and send response
 //  */
 // router.get("/publisherLPAndPOCApproved", function(req, res, next) {
 //   //var campID = req.body.campID;
 //   var campID = url.parse(req.url, true).query.campID;
 //   //var lpApproved=properties.get('lpApprovedORReject.Approved');
 //   var lpApproved='Approved';
 //   var pending=properties.get('pubStatus.pendingCampaign');  
 //   var accept=properties.get('pubStatus.acceptCampaign'); 
 //   res.locals.connection.query(
 //     "select pa.pID,pa.allocationID,pa.campID from publisher_allocation pa join landing_page_details lp on pa.pID=lp.pID and pa.campID=lp.campID join poc_details poc on pa.pID=poc.pID and pa.campID=poc.campID where pa.status='"+pending+"' AND lp.status='"+lpApproved+"'AND poc.status='"+lpApproved+"'",
 //     function(error, results, fields) {
 //       if (error) 
 //       {
 //       }else{
 //         for(var i=0;i<results.length;i++)
 //         {
 //           var sql="update publisher_allocation set status='"+accept+"' where allocationID='"+results[i].allocationID+"'"
 //           res.locals.connection.query(
 //            sql,function(error1, pubResults, fields)
 //             {
 //               if(error1)
 //               {
 //               }else{
 //               }
 //             })
 //         }
 
 //       }
 //       res.send(JSON.stringify(results));
 
 //     }
 //   );
 //   ////
 // });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign custom question from database
  * @return Description return successfully send response to react page
  */
 //Somnath Task-3851, Add authcheck middleware
 router.get("/campaignBriefCustomQuestionDetails",authCheck, function (req, res, next) {
   log.info("inside campaignBriefCustomQuestionDetails");
   //var campID = req.body.campID;
   var campID = url.parse(req.url, true).query.campID;
   pool.query(
     "select * from custom_questions WHERE campID ='" + campID + "'",
     function (error, results, fields) {
       if (error) {
         log.error("Error inside campaignBriefCustomQuestionDetails==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //
     }
   );
   ////
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Supporting Document Assets Details from database
  * @return Description return successfully send response to react page
  */
 //Somnath Task-3851, Add authcheck middleware
 router.get("/campaignBriefSupportingDocumentAssetDetails",authCheck, function (req, res, next) {
   log.info("inside campaignBriefSupportingDocumentAssetDetails");
   //var campID = req.body.campID;
   var result = [];
   var campID = url.parse(req.url, true).query.campID;
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
   var Asset = "Asset";
   pool.query(
     "select sd.supportDocID,sd.campID,sd.suppDocName,sd.leadPerAsset,sd.leadPercentage,c.requiredLeadPerAsset,sd.status as assetStatus,sd.multiTouch from supporting_document sd join campaign c on sd.campID=c.campID where sd.campID ='" +
     campID +
     "' AND sd.typeOfSuppDoc='" +
     Asset +
     "' and sd.document !='' and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null)",
     function (error, results, fields) {
       if (error) {
         log.error("Error inside campaignBriefSupportingDocumentAssetDetails==>" + error);
         throw error;
       }
       for (var i = 0; i < results.length; i++) {
         results[i].suppDocName = unescape(results[i].suppDocName);
       }
       res.send(JSON.stringify(results));
       //
 
     }
   );
   ////
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Supporting Document ABM Details from database
  * @return Description return successfully send response to react page
  */
 //Somnath Task-3851, Add authcheck middleware
 router.get("/campaignBriefSupportingDocumentAbmDetails",authCheck, function (req, res, next) {
   log.info("inside campaignBriefSupportingDocumentAbmDetails");
   var result = [];
   var campID = url.parse(req.url, true).query.campID;
 
   var Abm = "ABM";
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
   pool.query(
     "select supportDocID,campID,suppDocName from supporting_document WHERE campID ='" + campID + "' AND typeOfSuppDoc='" + Abm + "' and (deletedFlag!='" + deleteFlagYesStatus + "' or deletedFlag is null)", function (error, results, fields) {
       if (error) {
         log.error("Error inside campaignBriefSupportingDocumentAbmDetails==>" + error);
         throw error;
       }
 
       res.send(JSON.stringify(results));
       //
     }
   );
   // //
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Supporting Document Suppresion Details from database
  * @return Description return successfully send response to react page
  */
 //Somnath Task-3851, Add authcheck middleware
 router.get("/campaignBriefSupportingDocumentSuppresionDetails",authCheck, function (req, res, next) {
   log.info("inside campaignBriefSupportingDocumentSuppresionDetails");
   //var campID = req.body.campID;
   var result = [];
   var campID = url.parse(req.url, true).query.campID;
   var Suppresion = "Suppression";
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
   pool.query(
     "select supportDocID,campID,suppDocName from supporting_document WHERE campID ='" +
     campID +
     "' AND typeOfSuppDoc='" +
     Suppresion +
     "' and (deletedFlag!='" + deleteFlagYesStatus + "' or deletedFlag is null)",
     function (error, results, fields) {
       if (error) {
         log.error("Error In showing Suppression File Name" + error);
         return res.status(400).json(errors);
       }
       else {
         // for(var i=0;i<results.length;i++){
         //   if(results[i].assetLink!=='' || results[i].assetLink!==undefined || results[i].assetLink!=='null'|| results[i].assetLink!==null){
         //     results[i].suppDocName=unescape(results[i].suppDocName);
         //   }
         // }
         // if(results.length>0){
         // var check=results.filter(function(a){
         //   return a.assetLink;
         // })
         // if(check.length>0){
         //   results[0].isSuppLink=true;
         // }else{
         //   results[0].isSuppLink=false;
         // }
         // }
         res.send(JSON.stringify(results));
       }
     });
   ////
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Supporting Document Exclusion Details from database
  * @return Description return successfully send response to react page
  */
 //Somnath Task-3851, Add authcheck middleware
 router.get("/campaignBriefSupportingDocumentExclusionDetails",authCheck, function (req, res, next) {
   //var campID = req.body.campID;
   log.info("inside campaignBriefSupportingDocumentExclusionDetails");
   var result = [];
   var campID = url.parse(req.url, true).query.campID;
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
   var Exclusion = "Exclusion";
   pool.query(
     "select supportDocID,campID,suppDocName from supporting_document WHERE campID ='" +
     campID +
     "' AND typeOfSuppDoc='" +
     Exclusion +
     "'and (deletedFlag!='" + deleteFlagYesStatus + "' or deletedFlag is null)",
     function (error, results, fields) {
       if (error) {
         log.error("Error inside campaignBriefSupportingDocumentExclusionDetails==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //
     }
   );
   // //
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Supporting Document other Details from database
  * @return Description return successfully send response to react page
  */
 //Somnath Task-3851, Add authcheck middleware
 router.get("/campaignBriefSupportingDocumentotherDetails",authCheck, function (req, res, next) {
   log.info("inside campaignBriefSupportingDocumentotherDetails");
   var result = [];
   var campID = url.parse(req.url, true).query.campID;
   var other = "other";
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
   pool.query("select supportDocID,campID,suppDocName from supporting_document WHERE campID ='" + campID + "' AND typeOfSuppDoc='" + other + "' and (deletedFlag!='" + deleteFlagYesStatus + "' or deletedFlag is null)",
     function (error, results, fields) {
       if (error) {
         log.error("Error inside campaignBriefSupportingDocumentotherDetails==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //
     }
   );
   ////
 });
 
 
 /**
  *  @author somnath keswad
  *  Desc show Popup on selected campID with its Assets from supporting Document and landingPageDetails
  *  @version 1.0
  */
 router.post("/lpSubmissionPopUP", function (req, res, next) {
   log.info("inside lpSubmissionPopUP");
   var campID = req.body.campID;
   var pID = req.body.pID;//publisher ID HardCoaded because its given from publisher login
   const result1 = [];
   var Asset = "Asset";
   var query = "SELECT * from landing_page_details where campID='" + campID + "' AND pID='" + pID + "'";
   pool.query(query, function (error, results, fields) {
     if (error) {
       log.error("Error inside lpSubmissionPopUP==>" + error);
       throw error;
     }
     for (var i = 0, l = results.length; i < l; i++) {
       result1.push(results[i]);
     }
     if (results.length > 0) {
       var sql = "select sd.campID,ld.pID,sd.supportDocID,c.agencyID,sd.suppDocName,ld.lpLink, ld.status,ld.feedback,c.clientCampID from supporting_document sd left outer join landing_page_details ld  on sd.campID = ld.campID and sd.supportDocID=ld.supportDocID join campaign c on ld.campID=c.campID \
         where sd.campID='"+ campID + "' AND sd.typeOfSuppDoc='" + Asset + "' AND ld.pID='" + pID + "'";
       pool.query(sql, function (error, results, fields) {
         if (error) throw error;
         var listSuppDoc = [];
         for (var i = 0; i < results.length; i++) {
           listSuppDoc.push(results[i].supportDocID);
         }
         var sql1 = "select supportDocID,campID,suppDocName from supporting_document where campID='" + campID + "' and typeOfSuppDoc='" + Asset + "' and supportDocID NOT IN (?)";
         pool.query(sql1, [listSuppDoc], function (error, suppDocResult, fields) {
           if (error) {
             log.error("Error=" + error);
           } else {
             for (var i = 0; i < suppDocResult.length; i++) {
               results.push(suppDocResult[i]);
             }
             res.send(JSON.stringify(results));
             //
           }
         });////
       });
     }
     else {
       var query1 = "SELECT sd.campID,pa.pID, sd.supportDocID,sd.suppDocName,c.clientCampID,c.agencyID from supporting_document sd join publisher_allocation pa on pa.campID = sd.campID  join campaign c on sd.campID=c.campID  where pa.pID='" + pID + "' and sd.campID='" + campID + "' AND sd.typeOfSuppDoc='" + Asset + "'group by sd.supportDocID";
       pool.query(query1, function (error, results, fields) {
         if (error) {
           log.error("Error=" + error);
         }
         else {
           res.send(JSON.stringify(results));
         }
       });
     }
   });
 });
 
 
 /**
 * @author Somnath Keswad
 * @param  Description  Submit Landing Page Link
 * @return the Successfully submitted message.
 */
 router.post("/submitLandingPage", function (req, res, next) {
   log.info("In publisher/submitLandingPage");
   var success;
   var error;
   let { campID, clientCampID, parentCampID, reallocationID, agencyID, pID, user } = req.body;
 
   var description=campaignTraceProperties.get('campaign.submit.landingPage');//Sonali-3257-get details from properties file
   var description1=campaignTraceProperties.get('campaign.update.landingPage');//Sonali-3257-get details from properties file
 
   var stat = [];
   let AgencyApproved = properties.get("agencyStatus.creatives.Agency_Approved")
   var AdvertiserReviewPending = properties.get('agencyStatus.creatives.clientReviewPending');
   var clientApproved = properties.get('advertiserStatus.creative.clientApproved');
   var approved = properties.get('pubStatus.approve');
   var pendingSubmission = properties.get('agencyStatus.pendingSubmission');
   var agencyReviewPending = properties.get('agencyStatus.agencyReviewPending');
   /**
   * @author Narendra Phadke
   * @param  Description handle the Email functionality
   * @return Description return All Email
   */
 
   var userID = user.id;
   var user_role = "AC";
   var user_role1 = "PC";
   var user_role2 = "ANC"
   var EmailContentOfLP = [];
   var agencyDetails = [];
   var countlp;
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
   var supportDocID = req.body.supportDocID;
   const result = Array.from(new Set(newDynamicArray.map(sd => sd.supportDocID))).map(
     supportDocID => {
       return {
         supportDocID: supportDocID,
         suppDocName: newDynamicArray.find(sd => sd.supportDocID === supportDocID).suppDocName,
         status: newDynamicArray.find(sd => sd.supportDocID === supportDocID).lpStatus,
         lpLink: newDynamicArray.find(sd => sd.supportDocID === supportDocID).lpLink,
         assetStatus: newDynamicArray.find(sd => sd.supportDocID === supportDocID).assetStatus
       };
     });
   var status;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   let sql = "SELECT * from landing_page_details where campID='" + campID + "' AND pID='" + pID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error Publisher/submitLandingPage:" + error);
       return res.json({ success: false, message: "Error in Sql Operation" });
     }
     async function landingPage_Submit() {
       var listSuppDocID = [];
       for (let i = 0; i < results.length; i++) {
         listSuppDocID.push((results[i].supportDocID).toString());
       }
       const len = result.length;
       let cnt = 0;
       for (let i = 0; i < len; i++) {
         let feedback = "", sslFeedback = "", linkExist = false;
         let { lpLink } = result[i];
         let hostName, protocol, hasSSLCertificate = false;
         if (lpLink) {
           if (lpLink.includes('https') || lpLink.includes('http')) {
             let url = new URL(lpLink);
             hostName = url.hostname;
             protocol = url.protocol;
           } else {
             lpLink = "http://" + lpLink;
             let url = new URL(lpLink);
             hostName = url.hostname;
             protocol = url.protocol;
           }
         }
         // if(protocol==="https"){
         //   checkPort=true;
         // }else if(protocol=="http"){
         //   checkPort=false;
         // }
         let promise = new Promise((resolve, reject) => {
           const https = require('https');
           const options = {
             hostname: hostName,
             port: 443,
             path: '/',
             method: 'GET'
           };
           const req = https.request(options, (res) => {
             hasSSLCertificate = res.socket.authorized;
             resolve(hasSSLCertificate)
             resolve(true)
             res.on('data', (d) => {
               // process.stdout.write(d);
             });
           });
           req.on('error', (e) => {
             reject(false)
           });
           req.end();
         });
         let sslResult;
         try {
           sslResult = await promise;
         } catch (error) {
           hasSSLCertificate = false;
         }
         cnt++;
         let suppDocID = result[i].supportDocID;
         suppDocID = suppDocID.toString();
         let findSuppDocID = listSuppDocID.filter(function (id) {
           return suppDocID.includes(id);
         });
         if (findSuppDocID == '' || findSuppDocID == null || findSuppDocID == "" || findSuppDocID == undefined) {
           countlp = i;
           if (result[i].lpLink == undefined || result[i].lpLink == "" || result[i].lpLink == null) {
             status = pendingSubmission;
             result[i].lpLink = " ";
             linkExist = false;
           }
           else {
             status = agencyReviewPending;
             linkExist = true;
           }
           if (!hasSSLCertificate && linkExist) {
             status = pendingSubmission;
             sslFeedback = "Your connection is to this landing page link is not secure";
           }
 
           var sql = "insert into landing_page_details (campID,pID,supportDocID,lpLink,status,feedback,sslFeedback,created,lastUpdated) values('" + req.body.campID + "','" + req.body.pID + "','" + result[i].supportDocID + "','" + result[i].lpLink +
             "','" + status + "','" + feedback + "','" + sslFeedback + "','" + formatted + "','" + formatted + "')";
           pool.query(sql, function (error, results, fields) {
             if (error) {
               log.error("Error Publisher/submitLandingPage:" + error);
               throw error;
             } else {
               EmailContentOfLP.push(Object.assign({}, result[countlp]));
             }
           });
           var lpsubmission = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + req.body.campID + "','" + agencyID + "','" + req.body.pID + "','" + result[i].supportDocID + "','" + status + "','" + description + "','" + req.body.user.userID + "','" + req.body.user.firstName + "','" + req.body.user.lastName + "','" + formatted + "')";
           pool.query(lpsubmission, function (err, results, fields) {
             if (err) {
               log.error("Error Publisher/submitLandingPage:" + error);
             } else {
             }
           });
         } else {
 
           if (result[i].lpLink == undefined || result[i].lpLink.trim() == "" || result[i].lpLink == null) {
             var status = pendingSubmission;
             result[i].lpLink = '';
             linkExist = false;
           }
           else {
             var status = agencyReviewPending;
             linkExist = true;
           }
           var assetStatus = '';
           if (result[i].hasOwnProperty('assetStatus')) {
             assetStatus = result[i].assetStatus;
           }
 
           if (results[i].status == approved || results[i].status == clientApproved || results[i].status == AdvertiserReviewPending || assetStatus == 'Removed' || results[i].status == AgencyApproved) {
             // resolve
           } else {
             if (!hasSSLCertificate && linkExist) {
               status = pendingSubmission;
               sslFeedback = "Your connection is to this landing page link is not secure";
             }
             let query = "UPDATE landing_page_details SET ?  WHERE campID ='" + campID + "'AND supportDocID ='" + result[i].supportDocID + "'AND pID='" + pID + "'",
               values = {
                 lpLink: result[i].lpLink,
                 status,
                 sslFeedback,
                 lastUpdated: formatted,
               }
             pool.query(query, values, function (error, results, fields) {
               if (error) {
                 log.error("Error Publisher/submitLandingPage:" + error);
                 errors.publisher = "Feedback not submited";
                 return res.status(400).json(errors);
                 // reject
               } else {
                 EmailContentOfLP.push(Object.assign({}, result[countlp]));
                 //resolve
               }
             });
           }
           var updatelp = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + agencyID + "','" + pID + "','" + result[i].supportDocID + "','" + status + "','" + description1 + "','" + req.body.user.userID + "','" + req.body.user.firstName + "','" + req.body.user.lastName + "','" + formatted + "')";
           pool.query(updatelp, function (err, results, fields) {
             if (err) {
               log.error("Error Publisher/submitLandingPage:" + err);
             } else {
             }
           });
         }
         if (cnt == len) {
           success = 'Link is submitted successfully..Please close the window';
           res.json({ success: true, message: success });
         }
       }//End of for loop
     }// End of async
     landingPage_Submit();
 
     setTimeout(function () {
       var query = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "'and ud.orgID='" + agencyID + "' and ec.landingPageSubmit='" + emailConfigYes + "') OR (ud.role='" + user_role1 + "' and ud.orgID='" + userID + "' and ec.landingPageSubmit='" + emailConfigYes + "') OR (ud.role='" + user_role2 + "' and ud.orgID='" + agencyID + "' and ec.landingPageSubmit='" + emailConfigYes + "')";
       pool.query(query, function (error, results, fields) {
         if (error) {
           log.error("Error Publisher/submitLandingPage:" + error);
         }
         else {
           email.landingPageSubmission(user, campID, pID, results, result, parentCampID, reallocationID, agencyID);
         }
 
       });
     }, 4000);
   });
 });//End of submitLandingPage
 
 
 /**
  * @author somnath keswad
  * Desc show campID from publisherAssignment table and campaignName from Campaign Table 
  * @version 1.0
  **/
 //Somnath Task-3858, Add checkAuth middleware
 router.get("/lpReviewPendingForCampID",authCheck, function (req, res, next) {
   log.info("In Publisher/lpReviewPendingForCampID");
   const campID = url.parse(req.url, true).query.campID;
   let sql = `select pa.campID,c.campaignName,c.clientCampID,c.marketingChannel,c.creativeApprovalRequiredFor from publisher_allocation pa join campaign c on c.campID = pa.campID WHERE pa.campID=${campID} group by pa.campID`;
   pool.query(sql, (error, results, fields) => {
     if (error) {
       log.error("Error Publisher/lpReviewPendingForCampID:" + error);
       return res.status(400).json(error);
     }
     res.send(JSON.stringify(results));
   });
 });// End of lpReviewPendingForCampID
 
 /*@author Supriya Gore
  * Desc show campaign info from Campaign Table 
  @version 1.0
  */
 router.post("/campaignDetailsForCreativeUploads", function (req, res, next) {
   log.info("inside campaignDetailsForCreativeUploads");
   var campID = req.body.campID;
   pool.query(
     "select campaignName,campID,marketingChannel,parentCampID,reallocationID,agencyID,startDate,endDate,creativeApprovalRequiredFor from campaign WHERE campID=?",
     [campID],
     function (error, results, fields) {
       if (error) {
         log.error("Error inside campaignDetailsForCreativeUploads==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //
     }
   );
   ////
 });
 
 /**
  * @author somnath keswad
  * Desc show suppDocName, lpLink from  SupportingDocument Table
  *@version 1.0
  **/
 router.post("/lpReviewPending", function (req, res, next) {
   log.info("In Publisher/lpReviewPending");
   var campID = req.body.campID;
   var pID = req.body.pID;
   var errors;
   var pendingSubmission = properties.get('agencyStatus.pendingSubmission')
   pool.query(
     "select ld.id as landingPageID,ld.campID,ld.pID,p.publisherName, ld.supportDocID, sd.suppDocName,ld.lpLink, ld.status as lpStatus,ld.status as lp_status,ld.feedback as lpFeedback,lpFeedbackFileName,sd.status as assetStatus from landing_page_details ld join publisher p on p.pID = ld.pID join supporting_document sd on sd.supportDocID = ld.supportDocID where ld.campID='" + campID + "' and ld.pID='" + pID + "'and ld.status!='" + pendingSubmission + "'",
     function (error, creativeReview, fields) {
       if (error) {
         log.error("Error Publisher/lpReviewPending;" + error);
         return res.status(400).json(error);
       } else {
         var agencyReviewPending = properties.get('agencyStatus.agencyReviewPending')
         var sql = "SELECT pd.id as pocID,pd.campID,pd.pID,p.publisherName,sd.supportDocID,sd.suppDocName,pd.pocFileName,pd.status as pocStatus,pd.status as poc_status,pd.feedback as pocFeedback,pocFeedbackFileName,sd.status as assetStatus FROM poc_details pd join publisher p on pd.pID=p.pID join supporting_document sd on sd.supportDocID = pd.supportDocID where pd.campID='" + campID + "' and pd.pID='" + pID + "' and ( pd.status!='" + pendingSubmission + "')";
         pool.query(sql, function (error, POCReviewPendingList, fields) {
           if (error) {
             log.error("Error Publisher/lpReviewPending;" + error);
             return res.status(400).json(error);
           } else {
             var lpReviewPendingList = [];
             var lpLength = creativeReview.length;
             var pocLength = POCReviewPendingList.length;
             if (lpLength > pocLength) {
               lpReviewPendingList = creativeReview.map(x => Object.assign(x, POCReviewPendingList.find(y => y.supportDocID === x.supportDocID)));
             } else if (pocLength > lpLength) {
               lpReviewPendingList = POCReviewPendingList.map(x => Object.assign(x, creativeReview.find(y => y.supportDocID === x.supportDocID)));
             } else {
               lpReviewPendingList = POCReviewPendingList.map(x => Object.assign(x, creativeReview.find(y => y.supportDocID === x.supportDocID)));
             }
             var landingPageID = [];
             for (var i = 0; i < lpReviewPendingList.length; i++) {
               if (lpReviewPendingList[i].landingPageID === undefined) { }
               else {
                 landingPageID.push(lpReviewPendingList[i].landingPageID);
               }
             }
             var POCID = [];
             for (var i = 0; i < lpReviewPendingList.length; i++) {
               if (lpReviewPendingList[i].pocID === undefined) { }
               else {
                 POCID.push(lpReviewPendingList[i].pocID);
               }
             }
             if (landingPageID.length === 0) { landingPageID = [0] }
             var sql1 = "select ld.campID,ld.pID,p.publisherName, ld.supportDocID, sd.suppDocName,ld.lpLink, ld.status as lpStatus,ld.status as lp_status,ld.feedback as lpFeedback,lpFeedbackFileName,sd.status as assetStatus from landing_page_details ld join publisher p on p.pID = ld.pID join supporting_document sd on sd.supportDocID = ld.supportDocID where ld.campID='" + campID + "' and ld.pID='" + pID + "'and ld.status!='" + pendingSubmission + "' and ld.id NOT IN(?)";
             pool.query(sql1, [landingPageID], function (error, results1, fields) {
               if (error) {
                 log.error("Error Publisher/lpReviewPending;" + error);
                 return res.status(400).json(error);
               } else {
                 lpReviewPendingList = lpReviewPendingList.concat(results1);
                 if (POCID.length === 0) { POCID = [0] }
                 var sql2 = "SELECT pd.campID,pd.pID,p.publisherName,sd.supportDocID,sd.suppDocName,pd.pocFileName,pd.status as pocStatus,pd.status as poc_status,pd.feedback as pocFeedback,pocFeedbackFileName,sd.status as assetStatus FROM poc_details pd join publisher p on pd.pID=p.pID join supporting_document sd on sd.supportDocID = pd.supportDocID where pd.campID='" + campID + "' and pd.pID='" + pID + "' and (pd.status!='" + pendingSubmission + "') and pd.id NOT IN (?)";
                 pool.query(sql2, [POCID], function (error, results2, fields) {
                   if (error) {
                     log.error("Error Publisher/lpReviewPending;" + error);
                     return res.status(400).json(error);
                   } else {
                     lpReviewPendingList = lpReviewPendingList.concat(results2);
                     var csSql = "SELECT cs.id as csID,cs.campID,cs.pID,p.publisherName,sd.supportDocID,sd.suppDocName,cs.csFileName,cs.status as csStatus,cs.status as cs_status,cs.feedback as csFeedback,csFeedbackFileName,sd.status as assetStatus FROM call_script_details cs join publisher p on cs.pID=p.pID join supporting_document sd on sd.supportDocID = cs.supportDocID where cs.campID='" + campID + "' and cs.pID='" + pID + "' and cs.status!='" + pendingSubmission + "'";
                     pool.query(csSql, function (error, csReviewPendingList, fields) {
                       if (error) {
                         log.error("Error Publisher/lpReviewPending;" + error);
                         return res.status(400).json(error);
                       }
                       else {
                         var csLength = csReviewPendingList.length;
                         var finalResultLength = lpReviewPendingList.length;
                         var FinalReviewPendingList = [];
                         if (csLength > finalResultLength) {
                           FinalReviewPendingList = csReviewPendingList.map(x => Object.assign(x, lpReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                         }
                         else if (finalResultLength > csLength) {
                           FinalReviewPendingList = lpReviewPendingList.map(x => Object.assign(x, csReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                         }
                         else {
                           FinalReviewPendingList = lpReviewPendingList.map(x => Object.assign(x, csReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                         }
                         var cID = [];
                         for (var i = 0; i < FinalReviewPendingList.length; i++) {
                           if (FinalReviewPendingList[i].csID === undefined) { }
                           else {
                             cID.push(FinalReviewPendingList[i].csID);
                           }
                         }
                         if (cID.length === 0) { cID = [0] }
                         var sql1 = "select cs.campID,cs.pID,p.publisherName, cs.supportDocID, sd.suppDocName,cs.csFileName, cs.status as csStatus,cs.status as cs_status,cs.feedback as csFeedback,csFeedbackFileName,sd.status as assetStatus from call_script_details cs join publisher p on p.pID = cs.pID join supporting_document sd  on sd.supportDocID = cs.supportDocID   where cs.campID='" + campID + "' and cs.pID='" + pID + "'and cs.status!='" + pendingSubmission + "' and cs.id NOT IN(?)";
 
                         pool.query(sql1, [cID], function (error, results_cs, fields) {
                           if (error) {
                             log.error("Error Publisher/lpReviewPending;" + error);
                             return res.status(400).json(error);
                           }
                           else {
                             FinalReviewPendingList = FinalReviewPendingList.concat(results_cs);
                             for (let i = 0; i < lpReviewPendingList.length; i++) {
                               let { supportDocID, pID } = lpReviewPendingList[i];
                               let tmp = [lpReviewPendingList[i]]
                               let chk = FinalReviewPendingList.filter((a) => a.supportDocID == supportDocID && a.pID == pID);
                               if (chk.length > 0) {
                                 FinalReviewPendingList.map(x => Object.assign(x, tmp.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                               } else {
                                 FinalReviewPendingList = FinalReviewPendingList.concat(tmp);
                               }
                             }
                             for (var i = 0; i < FinalReviewPendingList.length; i++) {
                               FinalReviewPendingList[i].suppDocName = unescape(FinalReviewPendingList[i].suppDocName);
                             }
                             res.send(JSON.stringify(FinalReviewPendingList));
                           }
                         });
                       }
                     });
                   }
                 });
               }
             });
           }
         });
       }
     });
 });// End of lpReviewPending
 
 
 /**@author Somnath Keswad
  * Desc Submit the Landing Page Feedback
  *@version 1.0 return successfuly submission message
  **/
 //Somnath Task-3858, Add checkAuth middleware
 router.post("/submitLandingPageFeedback",authCheck, function (req, res, next) {
   log.info("In Publisher/submitLandingPageFeedback");
   let { campID, parentCampID, reallocationID, approvalFor } = req.body;
   var description=campaignTraceProperties.get('campaign.review.landingPage');//Sonali-3257-get details from properties file
 
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var success;
   var errors;
   let AgencyApproved = properties.get("agencyStatus.creatives.Agency_Approved")
   var AgencyReviewPending = properties.get('pubStatus.lpSubmission');
   var approved = properties.get('pubStatus.approve');
   var rejected = properties.get('pubStatus.rejected');
   var AdvertiserReviewPending = properties.get('agencyStatus.creatives.clientReviewPending');
   /**
     * @author Narendra Phadke
     * @param  Description handle the Email functionality
     * @return Description return All Email
     */
 
   var user = req.token;//Somnath Task-3858, Get Token from req.
   var user_role = "AC";
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
   for (let i = 0, l = newDynamicArray.length; i < l; i++) {
     try {
       if ((newDynamicArray[i].lpLink !== undefined || newDynamicArray[i].lpLink !== '') && newDynamicArray[i].lpStatus != undefined) {
         var feedback = newDynamicArray[i].lpFeedback;
         if (feedback === undefined || feedback === null || feedback === 'null') { feedback = '' }
 
         var lpFeedbackFileName = newDynamicArray[i].lpFeedbackFileName;
         if (lpFeedbackFileName === undefined || lpFeedbackFileName === null || lpFeedbackFileName === 'null') { lpFeedbackFileName = '' }
 
         if (newDynamicArray[i].lpStatus == approved || newDynamicArray[i].lpStatus == rejected) {
           var creativeStatus = '';
           if (newDynamicArray[i].lpStatus == approved) {
             if (approvalFor == "Agency" || approvalFor == "" || approvalFor == undefined || approvalFor == "undefined" || approvalFor == "null" || approvalFor == null || approvalFor == '') {
               creativeStatus = AgencyApproved;
               feedback = '';
             } else {
               creativeStatus = AdvertiserReviewPending;
             }
           } else {
             creativeStatus = rejected;
           }
           var sql = "UPDATE landing_page_details SET status ='" + creativeStatus + "', feedback ='" + feedback + "',lpFeedbackFileName='" + lpFeedbackFileName + "',lastUpdated='" + formatted + "' WHERE campID ='" + campID + "'AND pID='" + newDynamicArray[i].pID + "'AND supportDocID ='" + newDynamicArray[i].supportDocID + "'";
           pool.query(sql, function (error, results, fields) {
             if (error) {
               log.error("Error inside submitLandingPageFeedback==>" + error);
               errors.publisher = "Feedback not submited";
               return res.status(400).json(errors);
 
             } else {
               success = "Feedback submitted successfully.";
             }
           });
 
           var sql1 = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + newDynamicArray[i].pID + "','" + newDynamicArray[i].supportDocID + "','" + creativeStatus + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
           pool.query(sql1, function (error, results, fields) {
             if (error) { log.error("Error in Log Table when LpReview Submit :" + error) }
           });
         }/* End of IF Block which Status = Approved or Rejected */
       }
       /********** This for POC Submission */
 
       if (newDynamicArray[i].pocFileName !== undefined || newDynamicArray[i].pocFileName !== '') {
         /* Cannot Insert if status is not Selected in LP Review  */
         if (newDynamicArray[i].pocStatus == approved || newDynamicArray[i].pocStatus == rejected) {
           var feedback = newDynamicArray[i].pocFeedback;
           if (feedback === undefined || feedback === null || feedback === 'null') { feedback = '' }
           var pocFeedbackFileName = newDynamicArray[i].pocFeedbackFileName;
           if (pocFeedbackFileName === undefined || pocFeedbackFileName === null || pocFeedbackFileName === 'null') { pocFeedbackFileName = '' }
           var creativeStatus = '';
           if (newDynamicArray[i].pocStatus == approved) {
             if (approvalFor == "Agency" || approvalFor == "" || approvalFor == undefined || approvalFor == "undefined" || approvalFor == "null" || approvalFor == null || approvalFor == '') {
               creativeStatus = AgencyApproved;
               feedback = '';
             } else {
               creativeStatus = AdvertiserReviewPending;
             }
           } else {
             creativeStatus = rejected;
           }
 
           var sql = "UPDATE poc_details SET status ='" + creativeStatus + "', feedback ='" + feedback + "',pocFeedbackFileName='" + pocFeedbackFileName + "',lastUpdated='" + formatted + "' WHERE campID ='" + campID + "'AND pID='" + newDynamicArray[i].pID + "'AND supportDocID ='" + newDynamicArray[i].supportDocID + "'";
           pool.query(sql, function (error, results, fields) {
             if (error) {
               log.error("Error inside submitLandingPageFeedback 1==>" + error);
               errors.publisher = "Feedback not submited";
               return res.status(400).json(errors);
             } else {
             }
           });
           var description1=campaignTraceProperties.get('agency.poc.review');//Sonali-3257-get details from properties file
 
           var sql1 = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + newDynamicArray[i].pID + "','" + newDynamicArray[i].supportDocID + "','" + creativeStatus + "','" + description1 + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
           pool.query(sql1, function (error, results, fields) {
             if (error) { log.error("Error in Log Table when LpReview Submit :" + error) }
           });
         }/* End of IF Block which Status = Approved or Rejected */
       }/****** End of IF of checking LP_Link != Undefined */
       /***************** For CS Submission */
       if (newDynamicArray[i].csFileName !== undefined || newDynamicArray[i].csFileName !== '') {
         /* Cannot Insert if status is not Selected in LP Review  */
         if (newDynamicArray[i].csStatus == approved || newDynamicArray[i].csStatus == rejected) {
           var feedback = newDynamicArray[i].csFeedback;
           if (feedback === undefined || feedback === null || feedback === 'null') { feedback = '' }
           var csFeedbackFileName = newDynamicArray[i].csFeedbackFileName;
           if (csFeedbackFileName === undefined || csFeedbackFileName === null || csFeedbackFileName === 'null') { csFeedbackFileName = '' }
           var creativeStatus = '';
           if (newDynamicArray[i].csStatus == approved) {
             if (approvalFor == "Agency" || approvalFor == "" || approvalFor == undefined || approvalFor == "undefined" || approvalFor == "null" || approvalFor == null || approvalFor == '') {
               creativeStatus = AgencyApproved;
               feedback = '';
             } else {
               creativeStatus = AdvertiserReviewPending;
             }
           } else {
             creativeStatus = rejected;
           }
           var sql = "UPDATE call_script_details SET status ='" + creativeStatus + "', feedback ='" + feedback + "',csFeedbackFileName='" + csFeedbackFileName + "',lastUpdated='" + formatted + "' WHERE campID ='" + campID + "'AND pID='" + newDynamicArray[i].pID + "'AND supportDocID ='" + newDynamicArray[i].supportDocID + "'";
           pool.query(sql, function (error, results, fields) {
             if (error) {
               errors.publisher = "Feedback not submited";
               return res.status(400).json(errors);
 
             } else {
               success = "Feedback submitted successfully.";
               //res.json({ success: true, message: success });
             }
           });
           var description2=campaignTraceProperties.get('agency.callscript.review');//Sonali-3257-get details from properties file
 
           var sql1 = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + newDynamicArray[i].pID + "','" + newDynamicArray[i].supportDocID + "','" + creativeStatus + "','" + description2 + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
           pool.query(sql1, function (error, results, fields) {
             if (error) { log.error("Error in Log Table when LpReview Submit :" + error) }
           });
         }/* End of IF Block which Status = Approved Or Rejected */
       }
     } catch (error) {
       errors.publisher = "Feedback not submited";
       return res.status(400).json(errors);
     }
   }//End of for loop
 
   /**
  * @author Narendra Phadke
  * @param  Description handle the Email Functionality 
  * @return Description return successfully review landing page message
  */
 
 
   var user_role = "PC";
   var user_role1 = "AC";
   var user_role2 = "ANC";
   var user_role4 = "PNC";
   var publisherLoginDetails = [];
   // only find the unique pID from newDyanamicArray
   const result_pID = Array.from(new Set(newDynamicArray.map(p => p.pID))).map(pID => {
     return {
       pID: pID,
     };
   });
 
   for (let s = 0; s < result_pID.length; s++) {
     let count1 = s;
     //get all agency details from user_details table
     var queryTemp = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role in ('" + user_role1 + "','AQA','" + user_role2 + "') and ud.orgID='" + user.id + "' and ec.creativeReview='" + emailConfigYes + "') OR (ud.role in ('" + user_role + "','PQA','" + user_role4 + "') AND ud.orgID='" + result_pID[count1].pID + "' and ec.creativeReview='" + emailConfigYes + "') ";
     pool.query(queryTemp, function (err, results, fields) {
       if (err) {
         log.error("Error=" + err);
         errors.publisher = "Campaign not allocated";
         return res.status(400).json(errors);
       } else {
         email.landingPageReview(user, campID, results, result_pID[count1].pID, parentCampID, reallocationID);
         /**
          * @author Narendra Phadke
          * @param  Description handle the Alerts Functionality 
          * @return Description return insert alerts
          */
 
         let description = propertiesNotification.get('campaign.creatives.notification');
         let messageStatus = properties.get('Message.Unread');
         let queryAlerts = "insert into conversation_alerts SET ?",
           values = {
             campID: campID,
             agencyID: user.id,
             pID: result_pID[count1].pID,
             advertiserID: 0,
             userID: user.userID,
             sender: user.id,
             receiver: result_pID[count1].pID,
             description: description,
             status: messageStatus,
             created: formatted,
             lastUpdated: formatted
           };
 
         pool.query(queryAlerts, values, function (error, results, fields) {
           if (error) {
             log.error("Alerts inside campaign lead decrement to publisher Error==" + error);
           } else {
           }
         });
       }
     });
   }
   success = 'Feedback submitted successfully.';
   res.json({ success: true, message: success });
 });
 
 /**
  * @author Narendra Phadke
  * @param  Description Fetch the Campaign Supporting Document Files Details from database for download
  * @return Description return All Files to Download
  */
 router.get("/downloadCampaignDetails", function (req, res, next) {
   log.info("inside downloadCampaignDetails");
   var campID = url.parse(req.url, true).query.campID;
   var campaignName = url.parse(req.url, true).query.campName;
   var userID = url.parse(req.url, true).query.userID;
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
 
   // "select document,suppDocName from supporting_document WHERE campID ='" + campID +"' AND typeOfSuppDoc='" +asset + "' ",
   //Asset download
 
   /**
    * @author Supriya Gore
    * @param  Description Fetch the compaign delivery format in excel file
    * @return Description return All Files to Download
    */
   var fileName;
   res.setHeader('Content-Type', 'application/zip');
   res.setHeader('Content-Disposition', 'attachment; filename=myFile.zip');
   var zip = Archiver('zip');
   var campaignArray = [];
   var rowDataXlsx = {};
 
   var sql = "select * from delivery_format WHERE campID =?";
   pool.query(sql, [campID],
     function (error, results, fields) {
       if (error) throw error;
 
       //Supriya, Task:3091 - query changed for get customQuestionAliasName value
       //Somnath Task-3604, Added excludedIndustryFlag,excludedIndustryFileName,excludedIndustryFile
       var sql = "select clientCampID,campID,parentCampID,reallocationID,campaignName,clientName,jobTitle,jobLevel,jobFunction,industry,customIndustry,campaignStatus,region,country,state,stateFile,stateFileName,city,cityFile,cityFileName,zipCode,zipCodeFile,zipCodeFileName,startDate,endDate,firstLeadDeliveryDate,timezone,leadAllocation,ABM,campaignReportingDay,leadDeliveryOption,pacing,pacingLeadAllocation,insertionOrder,marketingChannel,otherSpecs,createdByCompanyName,status,budget,CPL,currency,employeeSize,customEmpSize,advertiserID,agencyID,companyRevenue,customCompRevenue,customJobFunction,lpTimeline,requiredLPApproval,customJobLevel,callAudit,multiTouch,customQuestionAliasName,excludedIndustryFlag,excludedIndustryFileName,excludedIndustryFile from campaign WHERE campID =?";
       pool.query(sql, [campID],
         function (error, resultsCamp, fields) {
           if (error) {
             log.error("Error inside downloadCampaignDetails==>" + error);
             throw error;
           }
 
           var agencyID = resultsCamp[0].agencyID;
 
           var sql;
 
           if (results[0].customizeMapping == "Yes") {
             sql = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "' and agencyID='" + agencyID + "'";
           } else {
             sql = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "' and deliveryPID='" + userID + "'";
           }
           pool.query(sql,
             function (error, deliveryResults, fields) {
               if (error) throw error;
 
               // else
               // {
               var sql = "select * from supporting_document WHERE campID =? AND typeOfSuppDoc='Asset' and (status!='Removed' or status is null) and (deletedFlag!='" + deleteFlagYesStatus + "' or deletedFlag is null)";
               pool.query(sql, [campID],
                 function (error, resultsAsset, fields) {
                   if (error) {
                     log.error("Error inside downloadCampaignDetails==>" + error);
 
                     throw error;
                   }
                   var sqlQuery = "select * from supporting_document WHERE campID ='" + campID + "' and document!='' and (status!='Removed' or status is null) and typeOfSuppDoc not in ('Sub_Suppression','Sub_ABM','Sub_Exclusion') and (deletedFlag!='" + deleteFlagYesStatus + "' or deletedFlag is null)";
                   pool.query(sqlQuery,
                     function (error, supportResult, fields) {
                       if (error) { log.error("Error") }
                       // else
                       // {
                       var sqlQuery = "select * from custom_questions WHERE campID ='" + campID + "'";
                       pool.query(sqlQuery,
                         function (error, questionResult, fields) {
                           if (error) { log.error("Error") }
                           //Supriya Task:3312 - Get country code from database
                           let countryCodeSql="Select ID, Upper(countryName) as countryName, Upper(countryCode) as countryCode, countryPhoneCode, currencies from country_code_info";
                           pool.query(countryCodeSql,async (error, countryCodeInfo)=> {
                             if (error){
                                log.error("Error publisher downloadCampaignDetails/countryCodeSql:"+error);//Log the error in logger
                                return res.status(400).json(error);//Return if error Occure
                             }
 
                           var yesStatus = properties.get('deliveryFormatStatus.yes.status');
 
                           // Lead URL
                           var leadDeliveryURL = '';
                           if (results.length > 0) {
                             var parentCampID = resultsCamp[0].parentCampID;
                             var allocationID = resultsCamp[0].reallocationID;
                             var alternatePhoneNo = '',jobTitle = '',jobLevel = '',jobFunction = '',companyRevenue = '',companyEmployeeSize = '',industry = '',assetName = '',assetID = '',assetNameTouch1 = '',assetNameTouch2 = '',assetNameTouch3 = '',assetTimestampTouch1 = '', assetTimestampTouch2 = '',assetTimestampTouch3 = '',street='',extra1 = '', extra2 = '', extra3 = '', extra4 = '', extra5 = '', allocationIDData = '', extra6='',extra7='',extra8='',extra9='',extra10='',extra11='',extra12='',extra13='',extra14='',extra15='',extra16='',extra17='',extra18='',extra19='',extra20='';
                             if (results[0].street === 'Yes') {//Somnath Task:3002, Add street if checked
                               street = '&street=""';
                             }
                             if (results[0].alternatePhoneNo === 'Yes') {
                               alternatePhoneNo = '&ALTPH=""';
                             }
                             if (results[0].jobTitle === 'Yes') {
                               jobTitle = '&jobTitle=""';
                             }
                             if (results[0].jobLevel === 'Yes') {
                               jobLevel = '&jobLevel=""';
                             }
                             if (results[0].jobFunction === 'Yes') {
                               jobFunction = '&jobFunction=""';
                             }
                             if (results[0].companyRevenue === 'Yes') {
                               companyRevenue = '&revenue=""';
                             }
                             if (results[0].companyEmployeeSize === 'Yes') {
                               companyEmployeeSize = '&companySize=""';
                             }
                             if (results[0].industry === 'Yes') {
                               industry = '&industry=""';
                             }
 
                             if (resultsCamp[0].multiTouch == 'Yes') {
 
                               if (results[0].assetNameTouch1 === 'Yes') {
                                 assetNameTouch1 = '&assetNameTouch1=""';
                               }
                               if (results[0].assetTimestampTouch1 === 'Yes') {
                                 assetTimestampTouch1 = '&assetTimestampTouch1=""';
                               }
                               if (results[0].assetNameTouch2 === 'Yes') {
                                 assetNameTouch2 = '&assetNameTouch2=""';
                               }
                               if (results[0].assetTimestampTouch2 === 'Yes') {
                                 assetTimestampTouch2 = '&assetTimestampTouch2=""';
                               }
                               if (results[0].assetNameTouch3 === 'Yes') {
                                 assetNameTouch3 = '&assetNameTouch3=""';
                               }
                               if (results[0].assetTimestampTouch3 === 'Yes') {
                                 assetTimestampTouch3 = '&assetTimestampTouch3=""';
                               }
                             }
                             else {
                               assetName = '&assetName=""';
 
                             }
 
 
                             if (results[0].supportDocID === 'Yes') {
                               assetID = '&assetID=""';
                             }
                             var linkedIn = '';
                             if (results[0].linkedIn === 'Yes') {
                               linkedIn = '&linkedIn=""';
                             }
                             var comments = '';
                             if (results[0].comments === 'Yes') {
                               comments = '&comments=""';
                             }
                             var domain = '';
                             if (results[0].domain === 'Yes') {
                               domain = '&domain=""';
                             }
                             var ip = '';
                             if (results[0].ip === 'Yes') {
                               ip = '&ip=""';
                             }
                             if (results[0].extra1 === 'Yes') {
                               extra1 = '&extra1=""';
                             }
                             if (results[0].extra2 === 'Yes') {
                               extra2 = '&extra2=""';
                             }
                             if (results[0].extra3 === 'Yes') {
                               extra3 = '&extra3=""';
                             }
                             if (results[0].extra4 === 'Yes') {
                               extra4 = '&extra4=""';
                             }
                             if (results[0].extra5 === 'Yes') {
                               extra5 = '&extra5=""';
                             }
                             //Somnath Task-3137, Add Extra Fields 6-20
                             if (results[0].extra6 === 'Yes') {
                               extra6 = '&extra6=""';
                             }
                             if (results[0].extra7 === 'Yes') {
                               extra7 = '&extra7=""';
                             }
                             if (results[0].extra8 === 'Yes') {
                               extra8 = '&extra8=""';
                             }
                             if (results[0].extra9 === 'Yes') {
                               extra9 = '&extra9=""';
                             }
                             if (results[0].extra10 === 'Yes') {
                               extra10 = '&extra10=""';
                             }
                             if (results[0].extra11 === 'Yes') {
                               extra11 = '&extra11=""';
                             }
                             if (results[0].extra12 === 'Yes') {
                               extra12 = '&extra12=""';
                             }
                             if (results[0].extra13 === 'Yes') {
                               extra13 = '&extra13=""';
                             }
                             if (results[0].extra14 === 'Yes') {
                               extra14 = '&extra14=""';
                             }
                             if (results[0].extra15 === 'Yes') {
                               extra15 = '&extra15=""';
                             }
                             if (results[0].extra16 === 'Yes') {
                               extra16 = '&extra16=""';
                             }
                             if (results[0].extra17 === 'Yes') {
                               extra17 = '&extra17=""';
                             }
                             if (results[0].extra18 === 'Yes') {
                               extra18 = '&extra18=""';
                             }
                             if (results[0].extra19 === 'Yes') {
                               extra19 = '&extra19=""';
                             }
                             if (results[0].extra20 === 'Yes') {
                               extra20 = '&extra20=""';
                             }
                             if (results[0].reAllocationID === 'Yes') {
                               allocationIDData = '&allocationID=' + allocationID;
                             }
                             var cqURL = '';
                             if (questionResult.length > 0) {
                               for (var i = 0; i < questionResult.length; i++) {
                                 var cq = '&CQ-' + questionResult[i].customQuestionID + '=""';
                                 cqURL += cq;
                               }
                             }
                             //Somnath Task:3002, Add street in lead Delivery URLs if checked
                             leadDeliveryURL = 'https://login.demandintegrate.com/leadAPIURL?campID=' + parentCampID + '&pID=' + userID + '&LIDT=MM/DD/YYYY&email=""&fname=""&lname=""&ADD=""&WP=""' + alternatePhoneNo + '&city=""&state=""&zipcode=""&country=""&companyName=""&linkedInCompanyName=""'+street + jobTitle + '&linkedInJobTitle=""' + jobLevel + jobFunction + companyRevenue + companyEmployeeSize + industry + assetName + assetNameTouch1 + assetTimestampTouch1 + assetNameTouch2 + assetTimestampTouch2 + assetNameTouch3 + assetTimestampTouch3 + assetID + allocationIDData + linkedIn + comments + domain + ip + extra1 + extra2 + extra3 + extra4 + extra5+extra6+extra7+extra8+extra9+extra10+extra11+extra12+extra13+extra14+extra15+extra16+extra17+extra18+extra19+extra20+ cqURL;
                           }
 
 
 
                           if (resultsCamp.length > 0) {
                             resultsCamp[0].customJobFunction = unescape(resultsCamp[0].customJobFunction);
                             resultsCamp[0].customJobLevel = unescape(resultsCamp[0].customJobLevel);
                           }
                           //campaignArray.push({'':results[0].landingPageConfigID});
                           if (resultsCamp[0].parentCampID == undefined || resultsCamp[0].parentCampID == null || resultsCamp[0].parentCampID == "") {
                             var parentCampID = resultsCamp[0].campID;
                           } else {
                             var parentCampID = resultsCamp[0].parentCampID;
                           }
 
                           const workbook = new Excel.Workbook();
                           const worksheet = workbook.addWorksheet('Lead Delivery');
                           var rowCellLengthArray = [];
                           var keyArray = [];
                           if (deliveryResults.length > 0) {
 
                             if (results[0].pID === yesStatus) {
                               // campaignArray["Publisher ID"]="";
                               rowDataXlsx['pID'] = userID;
                               // rowDataXlsx.push({key: 'pID',header:"", style: { font: {color: {argb:'00000000'} } }});
                               campaignArray.push({ header: deliveryResults[0].pID, key: 'pID', index: 'pID', width: 15 });
                               rowCellLengthArray.push('pID');
                               keyArray.push(deliveryResults[0].pID);
                               // worksheet.getCell('A1').name = 'pID';
                               // worksheet.getCell('pID').fill = {
                               //   type: 'pattern',
                               //   pattern:'solid',
                               //   fgColor:{argb:'FFFFFFFF'}
                               // };
                             }
 
                             // campaignArray["Campaign ID"]=parentCampID;
                             rowDataXlsx['campID'] = parentCampID;
                             campaignArray.push({ header: deliveryResults[0].campID, key: 'campID', width: 15 });
                             rowCellLengthArray.push('campID');
                             keyArray.push(deliveryResults[0].campID);
                             // worksheet.getCell('B1').fill = {
                             //   type: 'pattern',
                             //   pattern:'solid',
                             //   bgColor:{argb:'FF0000FF'}
                             // };
                             // if(results[0].campaignID===yesStatus)
                             // {
                             //   campaignArray["Campaign ID Status"]=results[0].campaignID;
                             // }
 
                             if (results[0].leadInteractionDate === yesStatus) {
                               // campaignArray["Lead Interaction Date"]="MM/DD/YYYY HH:MM:SS";
                               rowDataXlsx['leadInteractionDate'] = "MM/DD/YYYY HH:MM:SS";
                               campaignArray.push({ header: deliveryResults[0].leadInteractionDate, key: 'leadInteractionDate', width: 15 });
                               rowCellLengthArray.push('leadInteractionDate');
                               keyArray.push(deliveryResults[0].leadInteractionDate);
                             }
 
                             if (results[0].email === yesStatus) {
                               // campaignArray['Email']="";
                               rowDataXlsx['Email'] = "";
                               campaignArray.push({ header: deliveryResults[0].email, key: 'email', width: 15 });
                               rowCellLengthArray.push('Email');
                               keyArray.push(deliveryResults[0].email);
                             }
 
                             if (results[0].firstName === yesStatus) {
                               // campaignArray["First Name"]="";
                               rowDataXlsx['firstName'] = "";
                               campaignArray.push({ header: deliveryResults[0].firstName, key: 'firstName', width: 15 });
                               rowCellLengthArray.push('firstName');
                               keyArray.push(deliveryResults[0].firstName);
                             }
                             if (results[0].lastName === yesStatus) {
                               // campaignArray['Last Name']="";
                               rowDataXlsx['lastName'] = "";
                               campaignArray.push({ header: deliveryResults[0].lastName, key: 'lastName', width: 15 });
                               rowCellLengthArray.push('lastName');
                               keyArray.push(deliveryResults[0].lastName);
                             }
                             if (results[0].companyName === yesStatus) {
                               // campaignArray['Company Name']="";
                               rowDataXlsx['companyName'] = "";
                               campaignArray.push({ header: deliveryResults[0].companyName, key: 'companyName', width: 15 });
                               rowCellLengthArray.push('companyName');
                               keyArray.push(deliveryResults[0].companyName);
                             }
                             if (results[0].linkedInCompanyName === yesStatus) {
                               // campaignArray['Company Name']="";
                               rowDataXlsx['linkedInCompanyName'] = "";
                               campaignArray.push({ header: deliveryResults[0].linkedInCompanyName, key: 'linkedInCompanyName', width: 15 });
                               rowCellLengthArray.push('linkedInCompanyName');
                               keyArray.push(deliveryResults[0].linkedInCompanyName);
                             }
 
 
                             if (results[0].jobTitle === yesStatus) {
                               // campaignArray['Job Title']=resultsCamp[0].jobTitle;
                               rowDataXlsx['jobTitle'] = resultsCamp[0].jobTitle;
                               campaignArray.push({ header: deliveryResults[0].jobTitle, key: 'jobTitle', width: 15 });
                               rowCellLengthArray.push('jobTitle');
                               keyArray.push(deliveryResults[0].jobTitle);
                             }
                             if (results[0].linkedInJobTitle === yesStatus) {
                               // campaignArray['Job Title']=resultsCamp[0].jobTitle;
                               rowDataXlsx['linkedInJobTitle'] = resultsCamp[0].linkedInJobTitle;
                               campaignArray.push({ header: deliveryResults[0].linkedInJobTitle, key: 'linkedInJobTitle', width: 15 });
                               rowCellLengthArray.push('linkedInJobTitle');
                               keyArray.push(deliveryResults[0].linkedInJobTitle);
                             }
                             if (results[0].jobLevel === yesStatus) {
                              //Sonali-3383-jobLevel and custom jobLevel should be separated by |

                              var job_level = resultsCamp[0].jobLevel + "," + resultsCamp[0].customJobLevel;
                              var jobLevel = job_level.split(",").join("|");
                              // campaignArray['Job Level']=jobLevel;
                               rowDataXlsx['jobLevel'] = jobLevel;
                               campaignArray.push({ header: deliveryResults[0].jobLevel, key: 'jobLevel', width: 15 });
                               rowCellLengthArray.push('jobLevel');
                               keyArray.push(deliveryResults[0].jobLevel);
                             }
                             if (results[0].jobFunction === yesStatus) {
                              //Sonali-3383-jobfunction and custom jobfunction should be separated by |	

                              var jobFun = resultsCamp[0].jobFunction + "," + resultsCamp[0].customJobFunction;
                              var jobFunction = jobFun.split(",").join("|");
                              // campaignArray['Job Function']=jobFunction;
                               rowDataXlsx['jobFunction'] = jobFunction;
                               campaignArray.push({ header: deliveryResults[0].jobFunction, key: 'jobFunction', width: 15 });
                               rowCellLengthArray.push('jobFunction');
                               keyArray.push(deliveryResults[0].jobFunction);
                             }
 
 
                             if (results[0].address === yesStatus) {
                               // campaignArray['Address']="";
                               rowDataXlsx['address'] = "";
                               campaignArray.push({ header: deliveryResults[0].address, key: 'address', width: 15 });
                               rowCellLengthArray.push('address');
                               keyArray.push(deliveryResults[0].address);
                             }
                             if (results[0].city === yesStatus) {
                               // campaignArray['City']="";
                               rowDataXlsx['city'] = "";
                               campaignArray.push({ header: deliveryResults[0].city, key: 'city', width: 15 });
                               rowCellLengthArray.push('city');
                               keyArray.push(deliveryResults[0].city);
                             }
                             if (results[0].state === yesStatus) {
                               // campaignArray['State']="";
                               rowDataXlsx['state'] = "";
                               campaignArray.push({ header: deliveryResults[0].state, key: 'state', width: 15 });
                               rowCellLengthArray.push('state');
                               keyArray.push(deliveryResults[0].state);
                             }
 
                             if (results[0].country === yesStatus) {
                               var country = resultsCamp[0].country.split(",").join("|");
                               var array1 = resultsCamp[0].country.split(",");
                               // campaignArray['Country']=country;
                               rowDataXlsx['country'] = country;
                               campaignArray.push({ header: deliveryResults[0].country, key: 'country', width: 15 });
                               rowCellLengthArray.push('country');
                               keyArray.push(deliveryResults[0].country);
                             }
 
 
                             if (results[0].street === yesStatus) {
                               var region = resultsCamp[0].region.split(",").join("|");
                               // campaignArray['Street']=region;
                               rowDataXlsx['street'] = "";//Somnath task-3002, Make street blank
                               campaignArray.push({ header: deliveryResults[0].street, key: 'street', width: 15 });
                               rowCellLengthArray.push('street');
                               keyArray.push(deliveryResults[0].street);
                             }
 
                             if (results[0].zipCode === yesStatus) {
                               // campaignArray['Zipcode']="";
                               rowDataXlsx['zipcode'] = "";
                               campaignArray.push({ header: deliveryResults[0].zipCode, key: 'zipcode', width: 15 });
                               rowCellLengthArray.push('zipcode');
                               keyArray.push(deliveryResults[0].zipCode);
                             }
 
 
 
                             if (results[0].workPhone === yesStatus) {
 
                               let countryArray = countryCodeInfo;//Supriya Task:3312 - access country code info from DB
                               if (results[0].country === yesStatus) {
                                 var array1 = resultsCamp[0].country.split(",");
                                 let phoneCodeArray = [];
                                 for (var i = 0; i < array1.length; i++) {
                                   // if (array1[i] == "United States of America") {
                                   //   phoneCodeArray.push("1")
 
                                   // }
 
                                   function capital_letter(str) {
                                     str = str.split(" ");
 
                                     for (var i = 0, x = str.length; i < x; i++) {
                                       str[i] = str[i][0].toUpperCase() + str[i].substr(1);
                                     }
 
                                     return str.join(" ");
                                   }
                                   array1[i] = capital_letter(array1[i])
                                   //Supriya Task:3312 - in download template file country code added from DB
                                   array1[i] = array1[i].toUpperCase();
                                   for (var j = 0; j < countryArray.length; j++) {
                                     if (array1[i] == countryArray[j].countryName) {
                                       countryArray[j].countryPhoneCode = countryArray[j].countryPhoneCode.toString();
                                       countryArray[j].countryPhoneCode = countryArray[j].countryPhoneCode.replace("+", "");
                                       phoneCodeArray.push(countryArray[j].countryPhoneCode)
                                     }
                                   }
                                   //   let countryInfo = CountryCodes.findCountry({'name':array1[i]});
                                 }
                                 var phoneCode = phoneCodeArray.toString();
 
                                 var finalCodes = phoneCode.split(",").join("|");
                                 //  campaignArray['Phone']=finalCodes+"-1234567890";
                                 // rowDataXlsx['phone']=finalCodes+"-1234567890";
                                 rowDataXlsx['phone'] = deliveryResults[0].workPhoneFormat;
                                 campaignArray.push({ header: deliveryResults[0].workPhone, key: 'phone', width: 15 });
                                 rowCellLengthArray.push('phone');
                                 keyArray.push(deliveryResults[0].workPhone);
                               }
                               else {
                                 // campaignArray['Phone']="1-1234567890";
                                 // rowDataXlsx['phone']="1-1234567890";
                                 rowDataXlsx['phone'] = deliveryResults[0].workPhoneFormat;
                                 campaignArray.push({ header: deliveryResults[0].workPhone, key: 'phone', width: 15 });
                                 rowCellLengthArray.push('phone');
                                 keyArray.push(deliveryResults[0].workPhone);
                               }
                             }
                             if (results[0].companyRevenue === yesStatus) {
 
                              //Sonali-3383-company revenue and custom company revenue are separated by |

                              var compRevenue = resultsCamp[0].companyRevenue+","+resultsCamp[0].customCompRevenue;
                              var companyRevenue = compRevenue.split(",").join("|");
                              // campaignArray['Company Revenue']=companyRevenue;
                              if(companyRevenue.charAt(0)=="|"){
                               companyRevenue=companyRevenue.substr(1)
                              }
                               // campaignArray['Company Revenue']=companyRevenue;
                               rowDataXlsx['companyRevenue'] = companyRevenue;
                               campaignArray.push({ header: deliveryResults[0].companyRevenue, key: 'companyRevenue', width: 15 });
                               rowCellLengthArray.push('companyRevenue');
                               keyArray.push(deliveryResults[0].companyRevenue);
                             }
                             if (results[0].companyEmployeeSize === yesStatus) {
                                 //Sonali-3383-emp size and custom emp size are separated by |
                              //Somnath Task-3760, remove split by , and join | because we allows , in value	
                              var employeeSize = resultsCamp[0].employeeSize + "|" + resultsCamp[0].customEmpSize;	
                              if (employeeSize && employeeSize.charAt(0) == "|") {	
                                employeeSize = employeeSize.substr(1)	
                              }	
                              if (employeeSize && employeeSize.charAt(employeeSize.length - 1) == '|') {	
                                employeeSize = employeeSize.substr(0, employeeSize.length - 1);	
                              }
                               rowDataXlsx['companySize'] = employeeSize;
                               campaignArray.push({ header: deliveryResults[0].companyEmployeeSize, key: 'companySize', width: 15 });
                               rowCellLengthArray.push('companySize');
                               keyArray.push(deliveryResults[0].companyEmployeeSize);
                             }
                             if (results[0].industry === yesStatus) {
                               //3457-Sonali-industry value should be separated by | in delivery format file
                              var industry1 = resultsCamp[0].industry + "," + resultsCamp[0].customIndustry;
                              var industry = industry1.split(",").join("|");
                              rowDataXlsx['industry'] = industry
                               campaignArray.push({ header: deliveryResults[0].industry, key: 'industry', width: 15 });
                               rowCellLengthArray.push('industry');
                               keyArray.push(deliveryResults[0].industry);
                             }
                             if (results[0].ip === yesStatus) {
                               // campaignArray['IP']="";
                               rowDataXlsx['ip'] = "";
                               campaignArray.push({ header: deliveryResults[0].ip, key: 'ip', width: 15 });
                               rowCellLengthArray.push('ip');
                             }
                             if (results[0].supportDocID === yesStatus) {
                               var supportDocID = "";
                               for (var i = 0; i < resultsAsset.length; i++) {
                                 supportDocID = supportDocID + "|" + resultsAsset[i].supportDocID;
                               }
 
 
                               // campaignArray['Asset ID']=supportDocID;
                               rowDataXlsx['assetID'] = supportDocID;
                               campaignArray.push({ header: deliveryResults[0].supportDocID, key: 'assetID', width: 15 });
                               rowCellLengthArray.push(deliveryResults[0].supportDocID);
                             }
                             if (results[0].assetName === yesStatus) {
                               if (resultsCamp[0].multiTouch === "Yes") {
 
                                 var multiTouchAsset = "";
                                 var suppDocName = "";
 
                                 var assetTouch1 = "", assetTouch2 = "", assetTouch3 = "";
                                 for (var i = 0; i < resultsAsset.length; i++) {
                                   if (resultsAsset[i].multiTouch == "1st Touch") {
                                     assetTouch1 = assetTouch1 + "|" + unescape(resultsAsset[i].suppDocName);
                                   }
                                   if (resultsAsset[i].multiTouch == "2nd Touch") {
 
                                     assetTouch2 = assetTouch2 + "|" + unescape(resultsAsset[i].suppDocName);
 
                                   }
                                   if (resultsAsset[i].multiTouch == "3rd Touch") {
 
                                     assetTouch3 = assetTouch3 + "|" + unescape(resultsAsset[i].suppDocName);
 
                                   }
 
                                   suppDocName = suppDocName + "|" + unescape(resultsAsset[i].suppDocName);
                                   multiTouchAsset = multiTouchAsset + "|" + resultsAsset[i].multiTouch;
                                 }
 
                                 var onlyNum = (multiTouchAsset.match(/\d+/g).map(Number)).toString();
                                 onlyNum = onlyNum.split(',');
                                 var maxNum = Math.max(...onlyNum);
                                 if (maxNum == 3) {
                                   // campaignArray['1st Touch Asset Name']=assetTouch1;
                                   // campaignArray['1st Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   // campaignArray['2nd Touch Asset Name']=assetTouch2;
                                   // campaignArray['2nd Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   // campaignArray['3rd Touch Asset Name']=assetTouch3;
                                   // campaignArray['3rd Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
 
                                   rowDataXlsx['assetTouch1'] = assetTouch1;
                                   rowDataXlsx['assetTimestamp1'] = 'MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch2'] = assetTouch2;
                                   rowDataXlsx['assetTimestamp2'] = 'MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch3'] = assetTouch3;
                                   rowDataXlsx['assetTimestamp3'] = 'MM/DD/YYYY HH:MM:SS';
 
                                   campaignArray.push({ header: deliveryResults[0].assetNameTouch1, key: 'assetTouch1', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetTimestampTouch1, key: 'assetTimestamp1', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetNameTouch2, key: 'assetTouch2', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetTimestampTouch2, key: 'assetTimestamp2', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetNameTouch3, key: 'assetTouch3', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetTimestampTouch3, key: 'assetTimestamp3', width: 15 });
 
                                   rowCellLengthArray.push('assetTouch1');
                                   rowCellLengthArray.push('assetTimestamp1');
                                   rowCellLengthArray.push('assetTouch2');
                                   rowCellLengthArray.push('assetTimestamp2');
                                   rowCellLengthArray.push('assetTouch3');
                                   rowCellLengthArray.push('assetTimestamp3');
 
                                   keyArray.push(deliveryResults[0].assetNameTouch1);
                                   keyArray.push(deliveryResults[0].assetTimestampTouch1);
                                   keyArray.push(deliveryResults[0].assetNameTouch2);
                                   keyArray.push(deliveryResults[0].assetTimestampTouch2);
                                   keyArray.push(deliveryResults[0].assetNameTouch3);
                                   keyArray.push(deliveryResults[0].assetTimestampTouch3);
                                   // campaignArray['Asset Name']=suppDocName;
 
 
                                 }
                                 else if (maxNum == 2) {
                                   // campaignArray['1st Touch Asset Name']=assetTouch1;
                                   // campaignArray['1st Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   // campaignArray['2nd Touch Asset Name']=assetTouch2;
                                   // campaignArray['2nd Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch1'] = assetTouch1;
                                   rowDataXlsx['assetTimestamp1'] = 'MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch2'] = assetTouch2;
                                   rowDataXlsx['assetTimestamp2'] = 'MM/DD/YYYY HH:MM:SS';
 
                                   campaignArray.push({ header: deliveryResults[0].assetNameTouch1, key: 'assetTouch1', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetTimestampTouch1, key: 'assetTimestamp1', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetNameTouch2, key: 'assetTouch2', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetTimestampTouch2, key: 'assetTimestamp2', width: 15 });
                                   // campaignArray['Asset Name']=suppDocName;
 
                                   rowCellLengthArray.push('assetTouch1');
                                   rowCellLengthArray.push('assetTimestamp1');
                                   rowCellLengthArray.push('assetTouch2');
                                   rowCellLengthArray.push('assetTimestamp2');
 
 
                                   keyArray.push(deliveryResults[0].assetNameTouch1);
                                   keyArray.push(deliveryResults[0].assetTimestampTouch1);
                                   keyArray.push(deliveryResults[0].assetNameTouch2);
                                   keyArray.push(deliveryResults[0].assetTimestampTouch2);
 
                                 }
                                 else {
                                   // campaignArray['1st Touch Asset Name']=assetTouch1;
                                   // campaignArray['1st Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch1'] = assetTouch1;
                                   rowDataXlsx['assetTimestamp1'] = 'MM/DD/YYYY HH:MM:SS';
 
                                   campaignArray.push({ header: deliveryResults[0].assetNameTouch1, key: 'assetTouch1', width: 15 });
                                   campaignArray.push({ header: deliveryResults[0].assetTimestampTouch1, key: 'assetTimestamp1', width: 15 });
                                   // campaignArray['Asset Name']=suppDocName;
                                   rowCellLengthArray.push('assetTouch1');
                                   rowCellLengthArray.push('assetTimestamp1');
 
                                   keyArray.push(deliveryResults[0].assetNameTouch1);
                                   keyArray.push(deliveryResults[0].assetTimestampTouch1);
 
                                 }
                               }
                               else {
                                 var suppDocName = "";
                                 for (var i = 0; i < resultsAsset.length; i++) {
                                   suppDocName = suppDocName + "|" + unescape(resultsAsset[i].suppDocName);
                                 }
                                 // campaignArray['Asset Name']=suppDocName;
                                 rowDataXlsx['suppDocName'] = suppDocName;
                                 campaignArray.push({ header: deliveryResults[0].assetName, key: 'suppDocName', width: 15 });
                                 rowCellLengthArray.push('suppDocName');
                                 keyArray.push(deliveryResults[0].assetName);
                               }
                             }
                             //Supriya, Task:3091 - check condition for alias name is required
                             if(resultsCamp[0].customQuestionAliasName === yesStatus)
                             {
                               //Supriya, Task:3091 - add alias name to header with unescape for all question
                               for (var i = 0; i < questionResult.length; i++) {
                                 var question = 'CQ -' + unescape(questionResult[i].aliasName);
                                 // campaignArray[question]=unescape(questionResult[i].answer);
                                 rowDataXlsx[question] = unescape(questionResult[i].answer);
                                 campaignArray.push({ header: question, key: question, width: 15 });
                                 rowCellLengthArray.push('question');
                                 keyArray.push(question);
                               }
                             }else{
                               for (var i = 0; i < questionResult.length; i++) {
                                 var question = 'CQ -' + unescape(questionResult[i].customQuestion);
                                 // campaignArray[question]=unescape(questionResult[i].answer);
                                 rowDataXlsx[question] = unescape(questionResult[i].answer);
                                 campaignArray.push({ header: question, key: question, width: 15 });
                                 rowCellLengthArray.push('question');
                                 keyArray.push(question);
                               }
                             }
                             
 
                             if (results[0].extra1 === yesStatus) {
                               // campaignArray['Extra1']="";
                               rowDataXlsx['extra1'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra1, key: 'extra1', width: 15 });
                               rowCellLengthArray.push('extra1');
                             }
                             if (results[0].extra2 === yesStatus) {
                               // campaignArray['Extra2']="";
                               rowDataXlsx['extra2'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra2, key: 'extra2', width: 15 });
                               rowCellLengthArray.push('extra2');
                             }
                             if (results[0].extra3 === yesStatus) {
                               // campaignArray['Extra3']="";
                               rowDataXlsx['extra3'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra3, key: 'extra3', width: 15 });
                               rowCellLengthArray.push('extra3');
                             }
                             if (results[0].extra4 === yesStatus) {
                               // campaignArray['Extra4']="";
                               rowDataXlsx['extra4'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra4, key: 'extra4', width: 15 });
                               rowCellLengthArray.push('extra4');
                             }
                             if (results[0].extra5 === yesStatus) {
                               // campaignArray['Extra5']="";
                               rowDataXlsx['extra5'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra5, key: 'extra5', width: 15 });
                               rowCellLengthArray.push('extra5');
                             }
 
                             //Somnath Task-3137, Add Extra Fields
                             if (results[0].extra6 === yesStatus) {
                               rowDataXlsx['extra6'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra6, key: 'extra6', width: 15 });
                               rowCellLengthArray.push('extra6');
                             }
                             if (results[0].extra7 === yesStatus) {
                               rowDataXlsx['extra7'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra7, key: 'extra7', width: 15 });
                               rowCellLengthArray.push('extra7');
                             }
                             if (results[0].extra8 === yesStatus) {
                               rowDataXlsx['extra8'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra8, key: 'extra8', width: 15 });
                               rowCellLengthArray.push('extra8');
                             }
                             if (results[0].extra9 === yesStatus) {
                               rowDataXlsx['extra9'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra9, key: 'extra9', width: 15 });
                               rowCellLengthArray.push('extra9');
                             }
                             if (results[0].extra10 === yesStatus) {
                               rowDataXlsx['extra10'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra10, key: 'extra10', width: 15 });
                               rowCellLengthArray.push('extra10');
                             }
                             if (results[0].extra11 === yesStatus) {
                               rowDataXlsx['extra11'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra11, key: 'extra11', width: 15 });
                               rowCellLengthArray.push('extra11');
                             }
                             if (results[0].extra12 === yesStatus) {
                               rowDataXlsx['extra12'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra12, key: 'extra12', width: 15 });
                               rowCellLengthArray.push('extra12');
                             }
                             if (results[0].extra13 === yesStatus) {
                               rowDataXlsx['extra13'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra13, key: 'extra13', width: 15 });
                               rowCellLengthArray.push('extra13');
                             }
                             if (results[0].extra14 === yesStatus) {
                               rowDataXlsx['extra14'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra14, key: 'extra14', width: 15 });
                               rowCellLengthArray.push('extra14');
                             }
                             if (results[0].extra15 === yesStatus) {
                               rowDataXlsx['extra15'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra15, key: 'extra15', width: 15 });
                               rowCellLengthArray.push('extra15');
                             }
                             if (results[0].extra16 === yesStatus) {
                               rowDataXlsx['extra16'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra16, key: 'extra16', width: 15 });
                               rowCellLengthArray.push('extra16');
                             }
                             if (results[0].extra17 === yesStatus) {
                               rowDataXlsx['extra17'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra17, key: 'extra17', width: 15 });
                               rowCellLengthArray.push('extra17');
                             }
                             if (results[0].extra18 === yesStatus) {
                               rowDataXlsx['extra18'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra18, key: 'extra18', width: 15 });
                               rowCellLengthArray.push('extra18');
                             }
                             if (results[0].extra19 === yesStatus) {
                               rowDataXlsx['extra19'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra19, key: 'extra19', width: 15 });
                               rowCellLengthArray.push('extra19');
                             }
                             if (results[0].extra20 === yesStatus) {
                               rowDataXlsx['extra20'] = "";
                               campaignArray.push({ header: deliveryResults[0].extra20, key: 'extra20', width: 15 });
                               rowCellLengthArray.push('extra20');
                             }
 
                             if (results[0].reAllocationID === yesStatus) {
                               // campaignArray['Allocation ID']=resultsCamp[0].reallocationID;
                               rowDataXlsx['reallocationID'] = resultsCamp[0].reallocationID;
                               campaignArray.push({ header: deliveryResults[0].reAllocationID, key: 'reallocationID', width: 15 });
                               rowCellLengthArray.push('reallocationID');
                               keyArray.push('Allocation ID');
                             }
                             if (results[0].domain === yesStatus) {
                               // campaignArray['Domain']="";
                               rowDataXlsx['domain'] = "";
                               campaignArray.push({ header: deliveryResults[0].domain, key: 'domain', width: 15 });
                               rowCellLengthArray.push('domain');
                             }
                             if (results[0].alternatePhoneNo === yesStatus) {
                               // campaignArray['Alternate Phone No']="";
                               rowDataXlsx['alternatePhoneNo'] = "";
                               campaignArray.push({ header: deliveryResults[0].alternatePhoneNo, key: 'alternatePhoneNo', width: 15 });
                               rowCellLengthArray.push('alternatePhoneNo');
                             }
                             if (results[0].linkedIn === yesStatus) {
                               // campaignArray['LinkedIn']="";
                               rowDataXlsx['linkedIn'] = "";
                               campaignArray.push({ header: deliveryResults[0].linkedIn, key: 'linkedIn', width: 15 });
                               rowCellLengthArray.push('linkedIn');
                             }
                             if (results[0].comments === yesStatus) {
                               // campaignArray['Comments']="";
                               rowDataXlsx['comments'] = "";
                               campaignArray.push({ header: deliveryResults[0].comments, key: 'comments', width: 15 });
                               rowCellLengthArray.push('comments');
                             }
                             if ((resultsCamp[0].marketingChannel === "Email/Telemarketing" || resultsCamp[0].marketingChannel === "TeleMarketing") && (resultsCamp[0].callAudit === "Yes" || resultsCamp[0].callAudit === "yes")) {
 
                               //  if((resultsCamp[0].marketingChannel==="Email/Telemarketing" && resultsCamp[0].callAudit==="yes")){
                               // campaignArray['Channel']="Email|Telemarketing";
                               if (resultsCamp[0].marketingChannel === "Email/Telemarketing") {
 
                                 rowDataXlsx['marketingChannel'] = "Email|Telemarketing";
                               }
                               if (resultsCamp[0].marketingChannel === "TeleMarketing") {
 
                                 rowDataXlsx['marketingChannel'] = "Telemarketing";
                               }
                               campaignArray.push({ header: deliveryResults[0].channel, key: 'marketingChannel', width: 15 });
                               rowCellLengthArray.push('marketingChannel');
                               keyArray.push(deliveryResults[0].channel);
                               //keyArray.push(deliveryResults[0].channel);
                             }
 
                           }//end of customize delivery format
                           else {
                             if (results[0].pID === yesStatus) {
                               // campaignArray["Publisher ID"]="";
                               rowDataXlsx['pID'] = userID;
                               // rowDataXlsx.push({key: 'pID',header:"", style: { font: {color: {argb:'00000000'} } }});
                               campaignArray.push({ header: 'Publisher ID', key: 'pID', index: 'pID', width: 15 });
                               rowCellLengthArray.push('pID');
                               keyArray.push('Publisher ID');
                               // worksheet.getCell('A1').name = 'pID';
                               // worksheet.getCell('pID').fill = {
                               //   type: 'pattern',
                               //   pattern:'solid',
                               //   fgColor:{argb:'FFFFFFFF'}
                               // };
                             }
 
                             // campaignArray["Campaign ID"]=parentCampID;
                             rowDataXlsx['campID'] = parentCampID;
                             campaignArray.push({ header: 'Campaign ID', key: 'campID', width: 15 });
                             rowCellLengthArray.push('campID');
                             keyArray.push('Campaign ID');
 
 
                             if (results[0].leadInteractionDate === yesStatus) {
                               // campaignArray["Lead Interaction Date"]="MM/DD/YYYY HH:MM:SS";
                               rowDataXlsx['leadInteractionDate'] = "MM/DD/YYYY HH:MM:SS";
                               campaignArray.push({ header: 'Lead Interaction Date', key: 'leadInteractionDate', width: 15 });
                               rowCellLengthArray.push('leadInteractionDate');
                               keyArray.push('Lead Interaction Date');
                             }
 
                             if (results[0].email === yesStatus) {
                               // campaignArray['Email']="";
                               rowDataXlsx['Email'] = "";
                               campaignArray.push({ header: 'Email', key: 'email', width: 15 });
                               rowCellLengthArray.push('Email');
                               keyArray.push('Email');
                             }
 
                             if (results[0].firstName === yesStatus) {
                               // campaignArray["First Name"]="";
                               rowDataXlsx['firstName'] = "";
                               campaignArray.push({ header: 'First Name', key: 'firstName', width: 15 });
                               rowCellLengthArray.push('firstName');
                               keyArray.push('First Name');
                             }
                             if (results[0].lastName === yesStatus) {
                               // campaignArray['Last Name']="";
                               rowDataXlsx['lastName'] = "";
                               campaignArray.push({ header: 'Last Name', key: 'lastName', width: 15 });
                               rowCellLengthArray.push('lastName');
                               keyArray.push('Last Name');
                             }
                             if (results[0].companyName === yesStatus) {
                               // campaignArray['Company Name']="";
                               rowDataXlsx['companyName'] = "";
                               campaignArray.push({ header: 'Company Name', key: 'companyName', width: 15 });
                               rowCellLengthArray.push('companyName');
                               keyArray.push('Company Name');
                             }
                             if (results[0].linkedInCompanyName === yesStatus) {
                               // campaignArray['Company Name']="";
                               rowDataXlsx['linkedInCompanyName'] = "";
                               campaignArray.push({ header: 'Linkedin Company Name', key: 'linkedInCompanyName', width: 15 });
                               rowCellLengthArray.push('linkedInCompanyName');
                               keyArray.push('Linkedin Company Name');
                             }
                             if (results[0].jobTitle === yesStatus) {
                               // campaignArray['Job Title']=resultsCamp[0].jobTitle;
                               rowDataXlsx['jobTitle'] = resultsCamp[0].jobTitle;
                               campaignArray.push({ header: 'Job Title', key: 'jobTitle', width: 15 });
                               rowCellLengthArray.push('jobTitle');
                               keyArray.push('Job Title');
                             }
                             if (results[0].linkedInJobTitle === yesStatus) {
                               // campaignArray['Job Title']=resultsCamp[0].jobTitle;
                               rowDataXlsx['linkedInJobTitle'] = resultsCamp[0].linkedInJobTitle;
                               campaignArray.push({ header: 'Linkedin Job Title', key: 'linkedInJobTitle', width: 15 });
                               rowCellLengthArray.push('linkedInJobTitle');
                               keyArray.push('Linkedin Job Title');
                             }
                             if (results[0].jobLevel === yesStatus) {
                               var job_level = resultsCamp[0].jobLevel + "," + resultsCamp[0].customJobLevel;
                               var jobLevel = job_level.split(",").join("|");
                               // campaignArray['Job Level']=jobLevel;
                               rowDataXlsx['jobLevel'] = jobLevel;
                               campaignArray.push({ header: 'Job Level', key: 'jobLevel', width: 15 });
                               rowCellLengthArray.push('jobLevel');
                               keyArray.push('Job Level');
                             }
                             if (results[0].jobFunction === yesStatus) {
                               var jobFun = resultsCamp[0].jobFunction + "," + resultsCamp[0].customJobFunction;
                               var jobFunction = jobFun.split(",").join("|");
                               // campaignArray['Job Function']=jobFunction;
                               rowDataXlsx['jobFunction'] = jobFunction;
                               campaignArray.push({ header: 'Job Function', key: 'jobFunction', width: 15 });
                               rowCellLengthArray.push('jobFunction');
                               keyArray.push('Job Function');
                             }
 
 
                             if (results[0].address === yesStatus) {
                               // campaignArray['Address']="";
                               rowDataXlsx['address'] = "";
                               campaignArray.push({ header: 'Address', key: 'address', width: 15 });
                               rowCellLengthArray.push('address');
                               keyArray.push('Address');
                             }
                             if (results[0].city === yesStatus) {
                               // campaignArray['City']="";
                               rowDataXlsx['city'] = "";
                               campaignArray.push({ header: 'City', key: 'city', width: 15 });
                               rowCellLengthArray.push('city');
                               keyArray.push('City');
                             }
                             if (results[0].state === yesStatus) {
                               // campaignArray['State']="";
                               rowDataXlsx['state'] = "";
                               campaignArray.push({ header: 'State', key: 'state', width: 15 });
                               rowCellLengthArray.push('state');
                               keyArray.push('State');
                             }
 
                             if (results[0].country === yesStatus) {
                               var country = resultsCamp[0].country.split(",").join("|");
                               var array1 = resultsCamp[0].country.split(",");
                               // campaignArray['Country']=country;
                               rowDataXlsx['country'] = country;
                               campaignArray.push({ header: 'Country', key: 'country', width: 15 });
                               rowCellLengthArray.push('country');
                               keyArray.push('Country');
                             }
 
 
                             if (results[0].street === yesStatus) {
                               var region = resultsCamp[0].region.split(",").join("|");
                               // campaignArray['Street']=region;
                               rowDataXlsx['street'] = "";//Somnath task-3002, Make street blank
                               campaignArray.push({ header: 'Street', key: 'street', width: 15 });
                               rowCellLengthArray.push('street');
                               keyArray.push('Street');
                             }
 
                             if (results[0].zipCode === yesStatus) {
                               // campaignArray['Zipcode']="";
                               rowDataXlsx['zipcode'] = "";
                               campaignArray.push({ header: 'Zipcode', key: 'zipcode', width: 15 });
                               rowCellLengthArray.push('zipcode');
                               keyArray.push('Zipcode');
                             }
 
 
 
                             if (results[0].workPhone === yesStatus) {
 
                               let countryArray = countryCodeInfo;//Supriya Task:3312 - access country code info from DB
                               if (results[0].country === yesStatus) {
                                 var array1 = resultsCamp[0].country.split(",");
                                 let phoneCodeArray = [];
                                 for (var i = 0; i < array1.length; i++) {
                                   // if (array1[i] == "United States of America") {
                                   //   phoneCodeArray.push("1")
 
                                   // }
 
                                   function capital_letter(str) {
                                     str = str.split(" ");
 
                                     for (var i = 0, x = str.length; i < x; i++) {
                                       str[i] = str[i][0].toUpperCase() + str[i].substr(1);
                                     }
 
                                     return str.join(" ");
                                   }
                                   array1[i] = capital_letter(array1[i])
                                   //Supriya Task:3312 - in lead template download file country code added from DB
                                   array1[i]=array1[i].toUpperCase();
                                   for (var j = 0; j < countryArray.length; j++) {
                                     if (array1[i] == countryArray[j].countryName) {
                                       countryArray[j].countryPhoneCode = countryArray[j].countryPhoneCode.toString();
                                       countryArray[j].countryPhoneCode = countryArray[j].countryPhoneCode.replace("+", "");
                                       phoneCodeArray.push(countryArray[j].countryPhoneCode)
                                     }
                                   }
                                   //   let countryInfo = CountryCodes.findCountry({'name':array1[i]});
                                 }
                                 var phoneCode = phoneCodeArray.toString();
                                 var finalCodes = phoneCode.split(",").join("|");
                                 //  campaignArray['Phone']=finalCodes+"-1234567890";
                                 rowDataXlsx['phone'] = finalCodes + "-1234567890";
                                 campaignArray.push({ header: 'Phone', key: 'phone', width: 15 });
                                 rowCellLengthArray.push('phone');
                                 keyArray.push('Phone');
                               }
                               else {
                                 // campaignArray['Phone']="1-1234567890";
                                 rowDataXlsx['phone'] = "1-1234567890";
                                 campaignArray.push({ header: 'Phone', key: 'phone', width: 15 });
                                 rowCellLengthArray.push('phone');
                                 keyArray.push('Phone');
                               }
                             }
                             if (results[0].companyRevenue === yesStatus) {
                            //Sonali-3383-company revenue and custom company revenue are separated by |

                               var compRevenue = resultsCamp[0].companyRevenue+","+resultsCamp[0].customCompRevenue;
                               var companyRevenue = compRevenue.split(",").join("|");
                               // campaignArray['Company Revenue']=companyRevenue;
                               if(companyRevenue.charAt(0)=="|"){
                                companyRevenue=companyRevenue.substr(1)
                               }
                               rowDataXlsx['companyRevenue'] = companyRevenue;
                               campaignArray.push({ header: 'Company Revenue', key: 'companyRevenue', width: 15 });
                               rowCellLengthArray.push('companyRevenue');
                               keyArray.push('Company Revenue');
                             }
                              if (results[0].companyEmployeeSize === yesStatus) {
                                       //Sonali-3383-emp size and custom emp size are separated by |
                                         //Somnath Task-3760, remove split by , and join | because we allows , in value	
                                         var employeeSize = resultsCamp[0].employeeSize + "|" + resultsCamp[0].customEmpSize;	
                                         if (employeeSize && employeeSize.charAt(0) == "|") {	
                                           employeeSize = employeeSize.substr(1)	
                                         }	
                                         if (employeeSize && employeeSize.charAt(employeeSize.length - 1) == '|') {	
                                           employeeSize = employeeSize.substr(0, employeeSize.length - 1);	
                                         }
                               
                               // campaignArray['Company Size']=empSize;
                               rowDataXlsx['companySize'] = employeeSize;
                               campaignArray.push({ header: 'Company Size', key: 'companySize', width: 15 });
                               rowCellLengthArray.push('companySize');
                               keyArray.push('Company Size');
                             }
 
                             if (results[0].industry === yesStatus) {
                               // campaignArray['Industry']=resultsCamp[0].industry+""+resultsCamp[0].customIndustry;
 
                               // campaignArray['Company Revenue']=companyRevenue;
                               var industry1 = resultsCamp[0].industry + "," + resultsCamp[0].customIndustry;
                               var industry = industry1.split(",").join("|");
 
                               rowDataXlsx['industry'] = industry;
                               campaignArray.push({ header: 'Industry', key: 'industry', width: 15 });
                               rowCellLengthArray.push('industry');
                               keyArray.push('Industry');
                             }
                             if (results[0].ip === yesStatus) {
                               // campaignArray['IP']="";
                               rowDataXlsx['ip'] = "";
                               campaignArray.push({ header: 'IP', key: 'ip', width: 15 });
                               rowCellLengthArray.push('ip');
                             }
                             if (results[0].supportDocID === yesStatus) {
                               var supportDocID = "";
                               for (var i = 0; i < resultsAsset.length; i++) {
                                 supportDocID = supportDocID + "|" + resultsAsset[i].supportDocID;
                               }
 
 
                               // campaignArray['Asset ID']=supportDocID;
                               rowDataXlsx['assetID'] = supportDocID;
                               campaignArray.push({ header: 'Asset ID', key: 'assetID', width: 15 });
                               rowCellLengthArray.push('assetID');
                             }
                             if (results[0].assetName === yesStatus) {
                               if (resultsCamp[0].multiTouch === "Yes") {
 
                                 var multiTouchAsset = "";
                                 var suppDocName = "";
 
                                 var assetTouch1 = "", assetTouch2 = "", assetTouch3 = "";
                                 for (var i = 0; i < resultsAsset.length; i++) {
                                   if (resultsAsset[i].multiTouch == "1st Touch") {
                                     assetTouch1 = assetTouch1 + "|" + unescape(resultsAsset[i].suppDocName);
                                   }
                                   if (resultsAsset[i].multiTouch == "2nd Touch") {
 
                                     assetTouch2 = assetTouch2 + "|" + unescape(resultsAsset[i].suppDocName);
 
                                   }
                                   if (resultsAsset[i].multiTouch == "3rd Touch") {
 
                                     assetTouch3 = assetTouch3 + "|" + unescape(resultsAsset[i].suppDocName);
 
                                   }
 
                                   suppDocName = suppDocName + "|" + unescape(resultsAsset[i].suppDocName);
                                   multiTouchAsset = multiTouchAsset + "|" + resultsAsset[i].multiTouch;
                                 }
 
                                 var onlyNum = (multiTouchAsset.match(/\d+/g).map(Number)).toString();
                                 onlyNum = onlyNum.split(',');
                                 var maxNum = Math.max(...onlyNum);
                                 if (maxNum == 3) {
                                   // campaignArray['1st Touch Asset Name']=assetTouch1;
                                   // campaignArray['1st Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   // campaignArray['2nd Touch Asset Name']=assetTouch2;
                                   // campaignArray['2nd Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   // campaignArray['3rd Touch Asset Name']=assetTouch3;
                                   // campaignArray['3rd Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
 
                                   rowDataXlsx['assetTouch1'] = assetTouch1;
                                   rowDataXlsx['assetTimestamp1'] = 'MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch2'] = assetTouch2;
                                   rowDataXlsx['assetTimestamp2'] = 'MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch3'] = assetTouch3;
                                   rowDataXlsx['assetTimestamp3'] = 'MM/DD/YYYY HH:MM:SS';
 
                                   campaignArray.push({ header: '1st Touch Asset Name', key: 'assetTouch1', width: 15 });
                                   campaignArray.push({ header: '1st Touch Asset Timestamp', key: 'assetTimestamp1', width: 15 });
                                   campaignArray.push({ header: '2nd Touch Asset Name', key: 'assetTouch2', width: 15 });
                                   campaignArray.push({ header: '2nd Touch Asset Timestamp', key: 'assetTimestamp2', width: 15 });
                                   campaignArray.push({ header: '3rd Touch Asset Name', key: 'assetTouch3', width: 15 });
                                   campaignArray.push({ header: '3rd Touch Asset Timestamp', key: 'assetTimestamp3', width: 15 });
 
                                   rowCellLengthArray.push('assetTouch1');
                                   rowCellLengthArray.push('assetTimestamp1');
                                   rowCellLengthArray.push('assetTouch2');
                                   rowCellLengthArray.push('assetTimestamp2');
                                   rowCellLengthArray.push('assetTouch3');
                                   rowCellLengthArray.push('assetTimestamp3');
 
                                   keyArray.push('1st Touch Asset Name');
                                   keyArray.push('1st Touch Asset Timestamp');
                                   keyArray.push('2nd Touch Asset Name');
                                   keyArray.push('2nd Touch Asset Timestamp');
                                   keyArray.push('3rd Touch Asset Name');
                                   keyArray.push('3rd Touch Asset Timestamp');
                                   // campaignArray['Asset Name']=suppDocName;
 
 
                                 }
                                 else if (maxNum == 2) {
                                   // campaignArray['1st Touch Asset Name']=assetTouch1;
                                   // campaignArray['1st Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   // campaignArray['2nd Touch Asset Name']=assetTouch2;
                                   // campaignArray['2nd Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch1'] = assetTouch1;
                                   rowDataXlsx['assetTimestamp1'] = 'MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch2'] = assetTouch2;
                                   rowDataXlsx['assetTimestamp2'] = 'MM/DD/YYYY HH:MM:SS';
 
                                   campaignArray.push({ header: '1st Touch Asset Name', key: 'assetTouch1', width: 15 });
                                   campaignArray.push({ header: '1st Touch Asset Timestamp', key: 'assetTimestamp1', width: 15 });
                                   campaignArray.push({ header: '2nd Touch Asset Name', key: 'assetTouch2', width: 15 });
                                   campaignArray.push({ header: '2nd Touch Asset Timestamp', key: 'assetTimestamp2', width: 15 });
                                   // campaignArray['Asset Name']=suppDocName;
 
                                   rowCellLengthArray.push('assetTouch1');
                                   rowCellLengthArray.push('assetTimestamp1');
                                   rowCellLengthArray.push('assetTouch2');
                                   rowCellLengthArray.push('assetTimestamp2');
 
                                   keyArray.push('1st Touch Asset Name');
                                   keyArray.push('1st Touch Asset Timestamp');
                                   keyArray.push('2nd Touch Asset Name');
                                   keyArray.push('2nd Touch Asset Timestamp');
 
                                 }
                                 else {
                                   // campaignArray['1st Touch Asset Name']=assetTouch1;
                                   // campaignArray['1st Touch Asset Timestamp']='MM/DD/YYYY HH:MM:SS';
                                   rowDataXlsx['assetTouch1'] = assetTouch1;
                                   rowDataXlsx['assetTimestamp1'] = 'MM/DD/YYYY HH:MM:SS';
 
                                   campaignArray.push({ header: '1st Touch Asset Name', key: 'assetTouch1', width: 15 });
                                   campaignArray.push({ header: '1st Touch Asset Timestamp', key: 'assetTimestamp1', width: 15 });
                                   // campaignArray['Asset Name']=suppDocName;
                                   rowCellLengthArray.push('assetTouch1');
                                   rowCellLengthArray.push('assetTimestamp1');
 
                                   keyArray.push('1st Touch Asset Name');
                                   keyArray.push('1st Touch Asset Timestamp');
 
                                 }
                               }
                               else {
                                 var suppDocName = "";
                                 for (var i = 0; i < resultsAsset.length; i++) {
                                   suppDocName = suppDocName + "|" + unescape(resultsAsset[i].suppDocName);
                                 }
                                 // campaignArray['Asset Name']=suppDocName;
                                 rowDataXlsx['suppDocName'] = suppDocName;
                                 campaignArray.push({ header: 'Asset Name', key: 'suppDocName', width: 15 });
                                 rowCellLengthArray.push('suppDocName');
                                 keyArray.push('Asset Name');
                               }
                             }
 
                             //Supriya, Task:3091 - check alias name is required
                             if(resultsCamp[0].customQuestionAliasName === yesStatus)
                             {
                               //Supriya, Task:3091 - add alias name to header for all question
                               for (var i = 0; i < questionResult.length; i++) {
                                 for (var i = 0; i < questionResult.length; i++) {
                                   var question = 'CQ -' + unescape(questionResult[i].aliasName);
                                   // campaignArray[question]=unescape(questionResult[i].answer);
                                   rowDataXlsx[question] = unescape(questionResult[i].answer);
                                   campaignArray.push({ header: question, key: question, width: 15 });
                                   rowCellLengthArray.push('question');
                                   keyArray.push(question);
                                 }
                               }
                             }else{
                               for (var i = 0; i < questionResult.length; i++) {
                                 var question = 'CQ -' + unescape(questionResult[i].customQuestion);
                                 // campaignArray[question]=unescape(questionResult[i].answer);
                                 rowDataXlsx[question] = unescape(questionResult[i].answer);
                                 campaignArray.push({ header: question, key: question, width: 15 });
                                 rowCellLengthArray.push('question');
                                 keyArray.push(question);
                               }
                             }
 
                             if (results[0].extra1 === yesStatus) {
                               // campaignArray['Extra1']="";
                               rowDataXlsx['extra1'] = "";
                               campaignArray.push({ header: 'Extra1', key: 'extra1', width: 15 });
                               rowCellLengthArray.push('extra1');
                             }
                             if (results[0].extra2 === yesStatus) {
                               // campaignArray['Extra2']="";
                               rowDataXlsx['extra2'] = "";
                               campaignArray.push({ header: 'Extra2', key: 'extra2', width: 15 });
                               rowCellLengthArray.push('extra2');
                             }
                             if (results[0].extra3 === yesStatus) {
                               // campaignArray['Extra3']="";
                               rowDataXlsx['extra3'] = "";
                               campaignArray.push({ header: 'Extra3', key: 'extra3', width: 15 });
                               rowCellLengthArray.push('extra3');
                             }
                             if (results[0].extra4 === yesStatus) {
                               // campaignArray['Extra4']="";
                               rowDataXlsx['extra4'] = "";
                               campaignArray.push({ header: 'Extra4', key: 'extra4', width: 15 });
                               rowCellLengthArray.push('extra4');
                             }
                             if (results[0].extra5 === yesStatus) {
                               // campaignArray['Extra5']="";
                               rowDataXlsx['extra5'] = "";
                               campaignArray.push({ header: 'Extra5', key: 'extra5', width: 15 });
                               rowCellLengthArray.push('extra5');
                             }
 
                             //Somnath Task-3137, Add Extra Fields 6-20
                             if (results[0].extra6 === yesStatus) {
                               rowDataXlsx['extra6'] = "";
                               campaignArray.push({ header: 'Extra6', key: 'extra6', width: 15 });
                               rowCellLengthArray.push('extra6');
                             }
                             if (results[0].extra7 === yesStatus) {
                               rowDataXlsx['extra7'] = "";
                               campaignArray.push({ header: 'Extra7', key: 'extra7', width: 15 });
                               rowCellLengthArray.push('extra7');
                             }
                             if (results[0].extra8 === yesStatus) {
                               rowDataXlsx['extra8'] = "";
                               campaignArray.push({ header: 'Extra8', key: 'extra8', width: 15 });
                               rowCellLengthArray.push('extra8');
                             }
                             if (results[0].extra9 === yesStatus) {
                               rowDataXlsx['extra9'] = "";
                               campaignArray.push({ header: 'Extra9', key: 'extra9', width: 15 });
                               rowCellLengthArray.push('extra9');
                             }
                             if (results[0].extra10 === yesStatus) {
                               rowDataXlsx['extra10'] = "";
                               campaignArray.push({ header: 'Extra10', key: 'extra10', width: 15 });
                               rowCellLengthArray.push('extra10');
                             }
                             if (results[0].extra11 === yesStatus) {
                               rowDataXlsx['extra11'] = "";
                               campaignArray.push({ header: 'Extra11', key: 'extra11', width: 15 });
                               rowCellLengthArray.push('extra11');
                             }
                             if (results[0].extra12 === yesStatus) {
                               rowDataXlsx['extra12'] = "";
                               campaignArray.push({ header: 'Extra12', key: 'extra12', width: 15 });
                               rowCellLengthArray.push('extra12');
                             }
                             if (results[0].extra13 === yesStatus) {
                               rowDataXlsx['extra13'] = "";
                               campaignArray.push({ header: 'Extra13', key: 'extra13', width: 15 });
                               rowCellLengthArray.push('extra13');
                             }
                             if (results[0].extra14 === yesStatus) {
                               rowDataXlsx['extra14'] = "";
                               campaignArray.push({ header: 'Extra14', key: 'extra14', width: 15 });
                               rowCellLengthArray.push('extra14');
                             }
                             if (results[0].extra15 === yesStatus) {
                               rowDataXlsx['extra15'] = "";
                               campaignArray.push({ header: 'Extra15', key: 'extra15', width: 15 });
                               rowCellLengthArray.push('extra15');
                             }
                             if (results[0].extra16 === yesStatus) {
                               rowDataXlsx['extra16'] = "";
                               campaignArray.push({ header: 'Extra16', key: 'extra16', width: 15 });
                               rowCellLengthArray.push('extra16');
                             }
                             if (results[0].extra17 === yesStatus) {
                               rowDataXlsx['extra17'] = "";
                               campaignArray.push({ header: 'Extra17', key: 'extra17', width: 15 });
                               rowCellLengthArray.push('extra17');
                             }
                             if (results[0].extra18 === yesStatus) {
                               rowDataXlsx['extra18'] = "";
                               campaignArray.push({ header: 'Extra18', key: 'extra18', width: 15 });
                               rowCellLengthArray.push('extra18');
                             }
                             if (results[0].extra19 === yesStatus) {
                               rowDataXlsx['extra19'] = "";
                               campaignArray.push({ header: 'Extra19', key: 'extra19', width: 15 });
                               rowCellLengthArray.push('extra19');
                             }
                             if (results[0].extra20 === yesStatus) {
                               rowDataXlsx['extra20'] = "";
                               campaignArray.push({ header: 'Extra20', key: 'extra20', width: 15 });
                               rowCellLengthArray.push('extra20');
                             }
 
                             if (results[0].reAllocationID === yesStatus) {
                               // campaignArray['Allocation ID']=resultsCamp[0].reallocationID;
                               rowDataXlsx['reallocationID'] = resultsCamp[0].reallocationID;
                               campaignArray.push({ header: 'Allocation ID', key: 'reallocationID', width: 15 });
                               rowCellLengthArray.push('reallocationID');
                               keyArray.push('Allocation ID');
                             }
                             if (results[0].domain === yesStatus) {
                               // campaignArray['Domain']="";
                               rowDataXlsx['domain'] = "";
                               campaignArray.push({ header: 'Domain', key: 'domain', width: 15 });
                               rowCellLengthArray.push('domain');
                             }
                             if (results[0].alternatePhoneNo === yesStatus) {
                               // campaignArray['Alternate Phone No']="";
                               rowDataXlsx['alternatePhoneNo'] = "";
                               campaignArray.push({ header: 'Alternate Phone No', key: 'alternatePhoneNo', width: 15 });
                               rowCellLengthArray.push('alternatePhoneNo');
                             }
                             if (results[0].linkedIn === yesStatus) {
                               // campaignArray['LinkedIn']="";
                               rowDataXlsx['linkedIn'] = "";
                               campaignArray.push({ header: 'LinkedIn', key: 'linkedIn', width: 15 });
                               rowCellLengthArray.push('linkedIn');
                             }
                             if (results[0].comments === yesStatus) {
                               // campaignArray['Comments']="";
                               rowDataXlsx['comments'] = "";
                               campaignArray.push({ header: 'Comments', key: 'comments', width: 15 });
                               rowCellLengthArray.push('comments');
                             }
 
                             if ((resultsCamp[0].marketingChannel === "Email/Telemarketing" || resultsCamp[0].marketingChannel === "TeleMarketing") && (resultsCamp[0].callAudit === "Yes" || resultsCamp[0].callAudit === "yes")) {
                               if (resultsCamp[0].marketingChannel === "Email/Telemarketing") {
                                 // campaignArray['Channel']="Email|Telemarketing";
                                 rowDataXlsx['marketingChannel'] = "Email|Telemarketing";
                                 campaignArray.push({ header: 'Channel', key: 'marketingChannel', width: 15 });
                                 rowCellLengthArray.push('marketingChannel');
                                 keyArray.push('Channel');
                               }
                               if (resultsCamp[0].marketingChannel === "TeleMarketing") {
                                 // campaignArray['Channel']="Email|Telemarketing";
                                 rowDataXlsx['marketingChannel'] = "Telemarketing";
                                 campaignArray.push({ header: 'Channel', key: 'marketingChannel', width: 15 });
                                 rowCellLengthArray.push('marketingChannel');
                                 keyArray.push('Channel');
                               }
                               //keyArray.push('Channel');
                             }
 
                           }
                           // campaignArray['Lead Delivery Through API']=leadDeliveryURL;
                           rowDataXlsx['leadDeliveryURL'] = leadDeliveryURL;
                           campaignArray.push({ header: 'Lead Delivery Through API', key: 'leadDeliveryURL', width: 15 });
                           rowCellLengthArray.push('leadDeliveryURL');
                           worksheet.columns = campaignArray;
 
                           const rows = [rowDataXlsx];// pass JSON array
                           worksheet.addRows(rows);
 
                           worksheet.getRow(2).font = { color: '000000' };
                           let xlsxRow = worksheet.getRow(1);
 
                           keyArray.forEach(d => {
 
                             for (var a = 0; a < rowCellLengthArray.length; a++) {
                               [xlsxRow].forEach(x => {
 
                                 var y = a + 1;
                                 var cell = x.getCell(y);
                                 if (d.includes(cell.value)) {
                                   cell.fill = {
                                     type: 'pattern',
                                     pattern: 'solid',
                                     fgColor: { argb: '144999' }
                                   }
 
                                   cell.font = {
                                     color: { argb: 'FFFFFFFF' }
                                   }
                                 }
 
                               })
                             }
 
                           })
 
                           fileName = parentCampID + "_" + campaignName + "_Delivery_Template" + ".xlsx";
                           var contents;
                           workbook.xlsx.writeBuffer().then(function (buffer) {
 
                             contents = Buffer.from(buffer, "binary");
                             zip.append(contents, { name: fileName });
                           })
 
                           // campaignArray['Created Date']=results[0].created;
                           // campaignArray['Last Updated Date']=results[0].lastUpdated;
 
 
                           //var jsonArray = JSON.parse(campaignArray);
                           // //var finalDataArray=JSON.stringify(campaignArray);
                           //         var ws = xlsx.utils.json_to_sheet([campaignArray]);
                           // /* add to workbook */
                           // var wb = xlsx.utils.book_new();
                           // xlsx.utils.book_append_sheet(wb, ws, "Lead Delivery");
 
                           // // /* write workbook */
                           // var buf = xlsx.write(wb, {bookType:'xlsx', type:'buffer'}); // generate a nodejs buffer
                           // var str = xlsx.write(wb, {bookType:'xlsx', type:'binary'});
                           /* generate a download */
                           // function s2ab(s) {
                           // 	var buf = new ArrayBuffer(s.length);
                           // 	var view = new Uint8Array(buf);
                           //   for (var i=0; i!=s.length; ++i) 
                           //   view[i] = s.charCodeAt(i) & 0xFF;
                           // 	return buf;
                           // }
                           //  fileName=parentCampID+"_"+campaignName+"_Delivery_Template"+".xlsx";
                           //  zip.append(buf, { name: fileName });
                           //}
 
 
                           //   res.setHeader('Content-Type', 'application/zip');
                           //   res.setHeader('Content-Disposition', 'attachment; filename=myFile.zip');
                           //  var zip = Archiver('zip');
 
                           for (var i = 0, l = supportResult.length; i < l; i++) {
                             zip.append(supportResult[i].document, { name: unescape(supportResult[i].suppDocName) })
                           }
 
                           //Narendra- Add Some download file like state,city and zipcode
                           //state 
                           if (resultsCamp[0].state == "Yes") {
                             zip.append(resultsCamp[0].stateFile, { name: resultsCamp[0].stateFileName });
                           }
                           //City
                           if (resultsCamp[0].city == "Yes") {
                             zip.append(resultsCamp[0].cityFile, { name: resultsCamp[0].cityFileName });
                           }
                           //zip code
                             if (resultsCamp[0].zipCode == "Yes") {
                               zip.append(resultsCamp[0].zipCodeFile, { name: resultsCamp[0].zipCodeFileName });
                             }

                             //Somnath Task-3604, Add excludedIndustryFile
                             if (resultsCamp[0].excludedIndustryFlag == "Yes") {
                               zip.append(resultsCamp[0].excludedIndustryFile, { name: resultsCamp[0].excludedIndustryFileName });
                             }

                           // var leadFormatFileName;
                           // var industryFileName;
                           // if(resultsCamp[0] !== 'undefined' || resultsCamp[0].length !== 'undefined' || resultsCamp[0].length !==undefined){
                           //   leadFormatFileName = resultsCamp[0].leadDeliveryFileName;
                           //   industryFileName = resultsCamp[0].industryFileName;
 
 
                           //    if(leadFormatFileName!==""){
                           //     zip.append(resultsCamp[0].leadDeliveryFormat,{name:resultsCamp[0].leadDeliveryFileName});
                           //   }
                           //   if(industryFileName!==""){
                           //     zip.append(resultsCamp[0].industryFile,{name:resultsCamp[0].industryFileName});
                           //  }
                           // }
 
                           setTimeout(() => {
                             zip.finalize();
                             zip.pipe(res);
                           }, 1000);
                         })
                         })
                       //}
                     });
                 })
               //}
             })
           //}
         })
 
       // var sql="select document,suppDocName from supporting_document WHERE campID =?;select leadDeliveryFormat,industryFile,leadDeliveryFileName,industryFileName from campaign where campID=?";
       //     res.locals.connection.query(sql,[campID,campID],
       //       function(error, results, fields) {
       //         if (error) throw error;
 
       //         //   res.setHeader('Content-Type', 'application/zip');
       //         //   res.setHeader('Content-Disposition', 'attachment; filename=myFile.zip');
       //         //  var zip = Archiver('zip');
 
       //           for (var i = 0, l =results[0].length; i < l; i++) {
       //                   zip.append(results[0][i].document, { name: results[0][i].suppDocName })
       //             }
 
       //           var leadFormatFileName;
       //           var industryFileName;
       //           if(results[1][0] !== 'undefined' || results[1][0].length !== 'undefined' || results[1][0].length !==undefined){
       //             leadFormatFileName = results[1][0].leadDeliveryFileName;
       //             industryFileName = results[1][0].industryFileName;
 
       //           
 
       //              if(leadFormatFileName!==" "){
       //               zip.append(results[1][0].leadDeliveryFormat,{name:results[1][0].leadDeliveryFileName});
       //             }
       //             if(industryFileName!==" "){
       //               zip.append(results[1][0].industryFile,{name:results[1][0].industryFileName});
       //            }
       //           }
 
 
       //           zip.finalize();
       //           zip.pipe(res);   
       //     }
       //   )
 
 
     })
 });
 
 
 
 
 /*@author somnath keswad
  * Desc show Show delever lead info from lead-info Table
  @version 1.0
  */
 router.get("/showLeadReviewSelectBox", function (req, res, next) {
   log.info("inside showLeadReviewSelectBox");
   var campID = req.body.campID;
   var status = "Accept";
   pool.query(
     "SELECT pa.campID, pa.pID,pa.status,p.publisherName, c.campaignName, c.clientName FROM publisher_allocation pa join publisher p on pa.pID=p.pID join campaign c on c.campID=pa.campID where pa.status='" + status + "' group by pa.campID",
     function (error, results, fields) {
       if (error) {
         log.error("Error inside showLeadReviewSelectBox==>" + error);
         throw error;
       }
 
       res.send(JSON.stringify(results));
       //
     }
   );
   ////
 });
 
 
 
 /**
  * @author Narendra Phadke
  * @param  Description This will extract the lead delivery status on basis of publisher ID
  * @return Description return delivered lead status
  */
 router.get("/pubDeliveryStatus", function (req, res, next) {
   log.info("inside pubDeliveryStatus");
   //var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var QA_Review = properties.get('download.QA_Review.status');
   var accepted = properties.get('download.accepted.status');
   var clientAccepted = properties.get('clientReviewLead.clientAccepted.status');
   var rejected = properties.get('download.rejected.status');
   var clientRejected = properties.get('clientReviewLead.clientRejected.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var assetRemovalStatus = properties.get('agencyStatus.asset.REJECT_ASSET_REMOVED');
   //Narendra - I add status=clientRejected because now now count clinet rejected lead
   var query = "SELECT li.campID,Sum(CASE WHEN status = '" + accepted + "' OR status='" + QA_Review + "'  OR status='" + clientAccepted + "' OR status ='" + clientRejected + "' OR status ='" + rejected + "' OR status ='" + agencyInternalReview + "' OR status ='" + assetRemovalStatus + "' THEN 1 ELSE 0 END) as deliveredLead,Sum(CASE WHEN status = '" + accepted + "' OR status='" + clientAccepted + "' OR status='" + agencyInternalReview + "'  THEN 1 ELSE 0 END) as acceptedLead,Sum(CASE WHEN status = '" + QA_Review + "' THEN 1 ELSE 0 END) as qaReviewLead, Sum(CASE WHEN status ='" + rejected + "' OR  status ='" + clientRejected + "' OR status ='" + assetRemovalStatus + "' THEN 1 ELSE 0 END) as rejectedLead FROM   lead_info li INNER JOIN lead_info_status lis ON lis.leadInfoID = li.leadInfoID where pID='" + pID + "' GROUP  BY li.campID ";
   pool.query(query, function (error, results, fields) {
     if (error) {
       log.error("Error inside pubDeliveryStatus==>" + error);
       throw error;
     }
     //     var query1="SELECT campID,count(distinct (lf.leadInfoID))as totalReject FROM lead_info lf, lead_info_status ls where lf.leadInfoID = ls.leadInfoID and ls.status='Rejected' and lf.pID ='"+pID+"' group by campID";
     //     res.locals.connection.query( query1,function(error, results1, fields) {
     //       if (error) throw error;
     //       let merged = [];
 
     //               for(let i=0; i<results.length; i++) {
     //                 merged.push({...results[i],...(results1.find((itmInner) => itmInner.campID === results[i].campID))}
     //                 );
     //               }
 
     //    res.send(JSON.stringify(merged));
     //   });//
     res.send(JSON.stringify(results));
     //
   });
   // //
 });
 
 /* @author Narendra Phadke
   * @param  Description Download the delivered lead details
   * @return Description return excel file for download
   */
 //  router.post('/publisherDownloadLeadDetails', function(req, res, next) {
 //  // leadDisplay.leadDisplay(res,leadDetails);
 //  var leadStatus = properties.get('download.QA_Review.status');
 //  var leadStatus1 = properties.get('download.accepted.status');
 //  var leadDelivered=properties.get('clientReviewLead.clientAccepted.status');
 //  var leadRejected=properties.get('download.clientRejected.status');
 //  var rejected=properties.get('download.rejected.status');
 // // var leadStatus="QA Review";
 //   //var campID=req.body.campID;
 //   var campID = req.body.campID;
 //   var user = req.body.user;
 //   //Narendra - Adding clientAccepted lead for 
 //   //Sonali-Added rejected status to show in deliverd lead count
 //     pool.query("select  c.parentCampID,c.reallocationID,li.pID,li.leadInteractionDate,li.firstName,li.lastName,li.email,li.companyName,li.workPhone,li.jobTitle,li.address,li.country,li.city,li.state,li.zipCode,li.companyEmployeeSize,li.industry,li.AssetName,li.customQuestion1,li.customQuestion2,li.customQuestion3,li.customQuestion4,li.customQuestion5,li.customQuestion6,li.customQuestion7,li.customQuestion8,li.customQuestion9, lis.status from lead_info li left join lead_info_status lis ON li.leadInfoID=lis.leadInfoID  join campaign c on li.campID=c.campID where (li.campID='"+campID+"' AND li.pID='"+user.id+"' AND lis.status='"+leadStatus+"') OR (li.campID='"+campID+"' AND li.pID='"+user.id+"' AND lis.status='"+leadStatus1+"') OR (li.campID='"+campID+"' AND li.pID='"+user.id+"' AND lis.status='"+leadDelivered+"') OR (li.campID='"+campID+"' AND li.pID='"+user.id+"' AND lis.status='"+leadRejected+"')OR (li.campID='"+campID+"' AND li.pID='"+user.id+"' AND lis.status='"+rejected+"')",function(error, result, fields) {
 //       if (error){ throw error;}else{
 //     //     res.locals.connection.query("SELECT lf.*,ls.status FROM lead_info lf, lead_info_status ls  where lf.leadInfoID = ls.leadInfoID and ls.status like 'Reject%' and lf.pID ='"+user.id+"' and campID='"+campID+"' group by lf.leadInfoId",function(error, results1, fields) {
 //     //       if (error){ throw error;}else{
 //     //         let merged = [];
 
 //     //         merged=results.concat(results1);
 
 //     //     res.send(JSON.stringify(merged));
 //     //   }
 //     // });
 
 //     var size=result.length;
 //     var results=[];
 //     for(var i=0;i<size;i++){
 //       results.push({'campaign ID':result[i].parentCampID,'Allocation ID':result[i].reallocationID,'Publisher ID':result[i].pID,'leadInteractionDate':result[i].leadInteractionDate,'firstName':result[i].firstName,'lastName':result[i].lastName,'email':result[i].email,'companyName':result[i].companyName,'jobTitle':result[i].jobTitle,'workPhone':result[i].workPhone,'companyEmployeeSize':result[i].companyEmployeeSize,'industry':result[i].industry,'city':result[i].city,'country':result[i].country,'state':result[i].state,'zipCode':result[i].zipCode,'address':result[i].address,'assetName':result[i].assetName,'customQuestion1':result[i].customQuestion1,'customQuestion2':result[i].customQuestion2,'customQuestion3':result[i].customQuestion3,'customQuestion4':result[i].customQuestion4,'customQuestion5':result[i].customQuestion5,'customQuestion6':result[i].customQuestion6,'customQuestion7':result[i].customQuestion7,'customQuestion8':result[i].customQuestion8,'customQuestion9':result[i].customQuestion9,'status':result[i].status});
 //     }
 //     res.send(JSON.stringify(results));
 
 //     //
 //      }
 //   });
 // });
 
 /* @author Narendra Phadke
 * @param Description Download the delivered lead details
 * @return Description return excel file for download
 */
 router.post('/publisherDownloadLeadDetails', function (req, res, next) {
   log.info("In Publisher/publisherDownloadLeadDetails");
   // leadDisplay.leadDisplay(res,leadDetails);
   var leadStatus = properties.get('download.QA_Review.status');
   var leadStatus1 = properties.get('download.accepted.status');
   var leadDelivered = properties.get('clientReviewLead.clientAccepted.status');
   var leadRejected = properties.get('download.clientRejected.status');
   var agencyRejected = properties.get('download.rejected.status');
   var rejected = properties.get('reviewLead.pubRejected.status')
   var publisherQARejected = properties.get('reviewLead.publisherQARejected.status');
   var DI_QA_Accepted = properties.get('reviewLead.acceptedDI.status');
   var DI_QA_Rejected = properties.get('reviewLead.rejectedDI.status');
   var agencyQARejected = properties.get('reviewLead.agencyQARejected.status');
   var DI_QA_Review = properties.get('download.DI_Review.status');
   var assetRemovalStatus = properties.get('agencyStatus.asset.REJECT_ASSET_REMOVED');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var campID = req.body.campID;
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
   let statusArray = [leadStatus, leadStatus1, leadDelivered, leadRejected, rejected, agencyRejected, agencyInternalReview, assetRemovalStatus, publisherQARejected, agencyQARejected, DI_QA_Accepted, DI_QA_Rejected, DI_QA_Review];
   let timeout = 50;
   //Supriya, Task:3091 - query changed for get customQuestionAliasName value
   let sql1 = "select c.customQuestionAliasName,d.campID,d.campaignID,d.reAllocationID,d.leadInteractionDate,d.firstName,d.lastName,d.companyName,d.linkedInCompanyName,d.email,d.workPhone,d.jobTitle,d.linkedInJobTitle,d.jobLevel,d.jobFunction,d.country,d.address,d.street,d.city,d.state,d.zipCode,d.companyEmployeeSize,d.companyRevenue,d.industry,d.ip,d.supportDocID,d.assetName,d.assetNameTouch1,d.assetTimestampTouch1,d.assetNameTouch2,d.assetTimestampTouch2,d.assetNameTouch3,d.assetTimestampTouch3,d.extra1,d.extra2,d.extra3,d.extra4,d.extra5,d.linkedIn,d.comments,d.alternatePhoneNo,d.domain,d.additionalComments,c.callAudit,c.multiTouch from delivery_format d join campaign c on d.campID=c.campID  where d.campID='" + campID + "' "
   pool.query(sql1, function (error, deliveryResult, fields) {
     if (error) {
       log.error("Error Publisher/publisherDownloadLeadDetails:" + error);
       return res.status(400).json(error);
     }
      //Supriya, Task:3091 - query changed for get alias name
     let leadCQ = "SELECT cq.campID as parentCampID,cq.leadInfoID,cq.aliasName,cq.customQuestion,cq.answer from lead_custom_questions cq left join lead_info_status lis ON cq.leadInfoID=lis.leadInfoID join campaign c on cq.campID=c.campID where  cq.campID='" + campID + "' AND cq.pID='" + pID + "' AND lis.status in (?)";
     pool.query(leadCQ, [statusArray], function (error, leadQuestionResult, fields) {
       if (error) {
         log.error("Error Publisher/publisherDownloadLeadDetails:" + error);
         return res.status(400).json(error);
       }
 
       let dfMapping = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "'";
       pool.query(dfMapping, function (error, mappingResult, fields) {
         if (error) {
           log.error("Error Publisher/publisherDownloadLeadDetails:" + error);
           return res.status(400).json(error);
         }
         deliveryResult = JSON.parse(JSON.stringify(deliveryResult).split('"campaignID":').join('"campID":'));
         var yesStatus = properties.get('deliveryFormatStatus.yes.status');
         let campaignArray = {};
         if (deliveryResult[0].reAllocationID === yesStatus) {
           campaignArray['reAllocationID'] = "";
         }
         if (deliveryResult[0].jobLevel === yesStatus) {
           campaignArray['jobLevel'] = "";
         }
         if (deliveryResult[0].jobFunction === yesStatus) {
           campaignArray['jobFunction'] = "";
         }
         if (deliveryResult[0].industry === yesStatus) {
           campaignArray['industry'] = "";
         }
         if (deliveryResult[0].companyEmployeeSize === yesStatus) {
           campaignArray['companyEmployeeSize'] = "";
         }
         if (deliveryResult[0].street === yesStatus) {//Somnath Task:3002, Add street if checked
           campaignArray['street'] = "";
         }
         if (deliveryResult[0].companyRevenue === yesStatus) {
           campaignArray['companyRevenue'] = "";
         }
         if (deliveryResult[0].ip === yesStatus) {
           campaignArray['ip'] = "";
         }
         if (deliveryResult[0].supportDocID === yesStatus) {
           campaignArray['supportDocID'] = "";
         }
         if (deliveryResult[0].callAudit === 'Yes') {
           campaignArray['voiceLogLink'] = "";
         }
         if (deliveryResult[0].extra1 === yesStatus) {
           campaignArray['extra1'] = "";
         }
         if (deliveryResult[0].extra2 === yesStatus) {
           campaignArray['extra2'] = "";
         }
         if (deliveryResult[0].extra3 === yesStatus) {
           campaignArray['extra3'] = "";
         }
         if (deliveryResult[0].extra4 === yesStatus) {
           campaignArray['extra4'] = "";
         }
         if (deliveryResult[0].extra5 === yesStatus) {
           campaignArray['extra5'] = "";
         }
         if (deliveryResult[0].domain === yesStatus) {
           campaignArray['domain'] = "";
         }
         if (deliveryResult[0].alternatePhoneNo === yesStatus) {
           campaignArray['alternatePhoneNo'] = "";
         }
         if (deliveryResult[0].linkedIn === yesStatus) {
           campaignArray['linkedIn'] = "";
         }
         if (deliveryResult[0].comments === yesStatus) {
           campaignArray['comments'] = "";
         }
         if (deliveryResult[0].multiTouch === yesStatus) {
           timeout = 500;
           let sql = "select supportDocID,suppDocName,campID,typeOfSuppDoc,multiTouch from supporting_document where campID='" + campID + "'and typeOfSuppDoc='Asset' and (status!='Removed' or status is null)"
           var multiTouchAsset = "";
           pool.query(sql, function (err, resultsAsset, fields) {
             if (err) {
               log.error("Error Publisher/publisherDownloadLeadDetails:" + error);
               return res.status(400).json(error);
             }
             else {
               var assetTouch1 = "", assetTouch2 = "", assetTouch3 = "";
               for (var i = 0; i < resultsAsset.length; i++) {
                 if (resultsAsset[i].multiTouch == "1st Touch") {
                   assetTouch1 = assetTouch1 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "2nd Touch") {
                   assetTouch2 = assetTouch2 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "3rd Touch") {
                   assetTouch3 = assetTouch3 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 multiTouchAsset = multiTouchAsset + "|" + resultsAsset[i].multiTouch;
               }
               var onlyNum = (multiTouchAsset.match(/\d+/g).map(Number)).toString();
               onlyNum = onlyNum.split(',');
               var maxNum = Math.max(...onlyNum);
               if (maxNum === 3) {
                 three = true;
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 campaignArray['assetNameTouch3'] = "";
                 campaignArray['assetTimestampTouch3'] = "";
               }
               if (maxNum === 2) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 two = true;
               }
               if (maxNum === 1) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 one = true;
               }
             }
           });
         }
         else {
           campaignArray['assetName'] = "";
         }
         setTimeout(() => {
           let keys = Object.keys(campaignArray);
           let sql = "select li.leadInfoID,li.campID,li.pID,li.leadInteractionDate,li.firstName,li.lastName,li.email,li.companyName,li.linkedInCompanyName,li.workPhone,li.jobTitle,li.linkedInJobTitle,li.address,li.country,li.city,li.state,li.zipCode,li.companyEmployeeSize,li.industry,li.assetName,li." + keys.join(',li.') + ",lis.status,lr.reason from lead_info li left join lead_info_status lis ON li.leadInfoID=lis.leadInfoID  left join lead_info_reason lr ON li.leadInfoID=lr.leadInfoID where li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status in (?) group by li.leadInfoID";//Supriya Task:3075 - grouping by leadInfoID because sometimes result have leadInfoID multiple
           pool.query(sql, [statusArray], function (error, leadResult, fields) {
             if (error) {
               log.error("Error Publisher/publisherDownloadLeadDetails:" + error);
               return res.status(400).json(error);
             }
             else {
               const leadLength = leadResult.length;
               for (let i = 0; i < leadLength; i++) {
                 leadResult[i].assetName = unescape(leadResult[i].assetName);
                 var email = leadResult[i].email;
                 if (email.includes("@") == false) {
                   leadResult[i].email = cryptr.decrypt(leadResult[i].email);
                   leadResult[i].firstName = cryptr.decrypt(leadResult[i].firstName);
                   leadResult[i].lastName = cryptr.decrypt(leadResult[i].lastName);
                   leadResult[i].workPhone = cryptr.decrypt(leadResult[i].workPhone);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch1')) {
                   let touch1 = "assetNameTouch1";
                   leadResult[i][touch1] = unescape(leadResult[i][touch1]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch2')) {
                   let touch2 = "assetNameTouch2";
                   leadResult[i][touch2] = unescape(leadResult[i][touch2]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch3')) {
                   let touch3 = "assetNameTouch3";
                   leadResult[i][touch3] = unescape(leadResult[i][touch3]);
                 }
               }//End of for loop leadResult
 
               if (leadLength > 0) {
                 //Supriya Task:3075 - using common function for lead key change as per mapping
                 new Promise(async (reject) => {
                   //Supriya Task:3075 - add try/catch block to call function
                   try {
                     //Supriya Task:3075 - use async/await function for wait still get result
                     leadResult = await uploadLeadFunction.leadDownloadFunction(leadResult, mappingResult, deliveryResult);
           
                   } catch (error) { reject(error) }//End of catch block
                 })//End of Promise
       
 
                 const leadCQLength = leadQuestionResult.length;
                 for (let i = 0; i < leadLength; i++) {
                   for (let j = 0; j < leadCQLength; j++) {
                     if (leadResult[i].leadInfoID === leadQuestionResult[j].leadInfoID) {
                       let question = 'CQ -' + unescape(leadQuestionResult[j].customQuestion);
                       let answer = unescape(leadQuestionResult[j].answer);
                       leadResult[i][question] = answer;
                     }
                   }// End of leadQuestionResult loop
                 }// End of LeadResult loop
 
                 setTimeout(() => {
                   leadResult.map(function (leadReasult) {
                     leadReasult['Lead Info ID'] = leadReasult["leadInfoID"];
                     delete leadReasult["leadInfoID"];
 
                     leadReasult['Status'] = leadReasult["status"];
                     delete leadReasult["status"];
 
                     leadReasult['Reason'] = leadReasult["reason"];
                     delete leadReasult["reason"];
 
                     leadReasult['Voice Log Link'] = leadReasult["voiceLogLink"];
                     delete leadReasult["voiceLogLink"];
                     return leadReasult;
                   });
                   res.send(JSON.stringify(leadResult));
                 }, 1000)
               } else {
                 let success = "No Data Exists";
                 res.json({ success: true, message: success });
               }
             }
           });//End of leadResult 
         }, timeout)
       });//End of Delivery_Format_Mapping
     });//End of lead_Custom_Question
   });//End of delivery_format
 });//End of publisherDownloadLeadDetails
 
 
 /* @author Narendra Phadke
   * @param  Description Download the accepted lead details
   * @return Description return excel file for download
   */
 router.post('/publisherDownloadAcceptedLeadDetails',authCheck,function (req, res, next) {
   log.info("In Publisher/publisherDownloadAcceptedLeadDetails");
   // leadDisplay.leadDisplay(res,leadDetails);
 
   var leadStatus1 = properties.get('download.accepted.status');
   var clientAccepted = properties.get('clientReviewLead.clientAccepted.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var DI_QA_Accepted = properties.get('reviewLead.acceptedDI.status');
   let statusArray = [leadStatus1, clientAccepted, DI_QA_Accepted]//Supriya-Task-3075 Remove AgencyInternal review status from Array because in accepted lead we can't download agency Internal review
   //var campID=req.body.campID;
   var campID = req.body.campID;
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
   let timeout = 50;
   let sql1 = "select d.campID,d.campaignID,d.reAllocationID,d.leadInteractionDate,d.firstName,d.lastName,d.companyName,d.linkedInCompanyName,d.email,d.workPhone,d.jobTitle,d.linkedInJobTitle,d.jobLevel,d.jobFunction,d.country,d.address,d.street,d.city,d.state,d.zipCode,d.companyEmployeeSize,d.companyRevenue,d.industry,d.ip,d.supportDocID,d.assetName,d.assetNameTouch1,d.assetTimestampTouch1,d.assetNameTouch2,d.assetTimestampTouch2,d.assetNameTouch3,d.assetTimestampTouch3,d.extra1,d.extra2,d.extra3,d.extra4,d.extra5,d.linkedIn,d.comments,d.alternatePhoneNo,d.domain,d.additionalComments,c.callAudit,c.multiTouch from delivery_format d join campaign c on d.campID=c.campID  where d.campID='" + campID + "' "
   pool.query(sql1, function (error, deliveryResult, fields) {
     if (error) {
       log.error("Error Publisher/publisherDownloadAcceptedLeadDetails:" + error);
       return res.status(400).json(error);
     }
     let leadCQ = "SELECT cq.campID as parentCampID,cq.leadInfoID,cq.customQuestion,cq.answer from lead_custom_questions cq left join lead_info_status lis ON cq.leadInfoID=lis.leadInfoID join campaign c on cq.campID=c.campID where  cq.campID='" + campID + "' AND cq.pID='" + pID + "' AND lis.status in (?)";
     pool.query(leadCQ, [statusArray], function (error, leadQuestionResult, fields) {
       if (error) {
         log.error("Error Publisher/publisherDownloadAcceptedLeadDetails:" + error);
         return res.status(400).json(error);
       }
 
       let dfMapping = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "'";
       pool.query(dfMapping, function (error, mappingResult, fields) {
         if (error) {
           log.error("Error Publisher/publisherDownloadAcceptedLeadDetails:" + error);
           return res.status(400).json(error);
         }
         deliveryResult = JSON.parse(JSON.stringify(deliveryResult).split('"campaignID":').join('"campID":'));
         var yesStatus = properties.get('deliveryFormatStatus.yes.status');
         let campaignArray = {};
         if (deliveryResult[0].reAllocationID === yesStatus) {
           campaignArray['reAllocationID'] = "";
         }
         if (deliveryResult[0].jobLevel === yesStatus) {
           campaignArray['jobLevel'] = "";
         }
         if (deliveryResult[0].jobFunction === yesStatus) {
           campaignArray['jobFunction'] = "";
         }
         if (deliveryResult[0].industry === yesStatus) {
           campaignArray['industry'] = "";
         }
         if (deliveryResult[0].companyEmployeeSize === yesStatus) {
           campaignArray['companyEmployeeSize'] = "";
         }
         if (deliveryResult[0].street === yesStatus) {//Somnath Task:3002, Add street if checked
           campaignArray['street'] = "";
         }
         if (deliveryResult[0].companyRevenue === yesStatus) {
           campaignArray['companyRevenue'] = "";
         }
         if (deliveryResult[0].ip === yesStatus) {
           campaignArray['ip'] = "";
         }
         if (deliveryResult[0].supportDocID === yesStatus) {
           campaignArray['supportDocID'] = "";
         }
         if (deliveryResult[0].callAudit === 'Yes') {
           campaignArray['voiceLogLink'] = "";
         }
         if (deliveryResult[0].extra1 === yesStatus) {
           campaignArray['extra1'] = "";
         }
         if (deliveryResult[0].extra2 === yesStatus) {
           campaignArray['extra2'] = "";
         }
         if (deliveryResult[0].extra3 === yesStatus) {
           campaignArray['extra3'] = "";
         }
         if (deliveryResult[0].extra4 === yesStatus) {
           campaignArray['extra4'] = "";
         }
         if (deliveryResult[0].extra5 === yesStatus) {
           campaignArray['extra5'] = "";
         }
         if (deliveryResult[0].domain === yesStatus) {
           campaignArray['domain'] = "";
         }
         if (deliveryResult[0].alternatePhoneNo === yesStatus) {
           campaignArray['alternatePhoneNo'] = "";
         }
         if (deliveryResult[0].linkedIn === yesStatus) {
           campaignArray['linkedIn'] = "";
         }
         if (deliveryResult[0].comments === yesStatus) {
           campaignArray['comments'] = "";
         }
         if (deliveryResult[0].multiTouch === yesStatus) {
           timeout = 500;
           let sql = "select supportDocID,suppDocName,campID,typeOfSuppDoc,multiTouch from supporting_document where campID='" + campID + "'and typeOfSuppDoc='Asset' and (status!='Removed' or status is null)"
           var multiTouchAsset = "";
           pool.query(sql, function (err, resultsAsset, fields) {
             if (err) {
               log.error("Error Publisher/publisherDownloadAcceptedLeadDetails:" + error);
               return res.status(400).json(error);
             }
             else {
               var assetTouch1 = "", assetTouch2 = "", assetTouch3 = "";
               for (var i = 0; i < resultsAsset.length; i++) {
                 if (resultsAsset[i].multiTouch == "1st Touch") {
                   assetTouch1 = assetTouch1 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "2nd Touch") {
                   assetTouch2 = assetTouch2 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "3rd Touch") {
                   assetTouch3 = assetTouch3 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 multiTouchAsset = multiTouchAsset + "|" + resultsAsset[i].multiTouch;
               }
               var onlyNum = (multiTouchAsset.match(/\d+/g).map(Number)).toString();
               onlyNum = onlyNum.split(',');
               var maxNum = Math.max(...onlyNum);
               if (maxNum === 3) {
                 three = true;
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 campaignArray['assetNameTouch3'] = "";
                 campaignArray['assetTimestampTouch3'] = "";
               }
               if (maxNum === 2) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 two = true;
               }
               if (maxNum === 1) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 one = true;
               }
             }
           });
         }
         else {
           campaignArray['assetName'] = "";
         }
         setTimeout(() => {
           let keys = Object.keys(campaignArray);
           let sql = "select li.leadInfoID,li.campID,li.pID,li.leadInteractionDate,li.firstName,li.lastName,li.email,li.companyName,li.linkedInCompanyName,li.workPhone,li.jobTitle,li.linkedInJobTitle,li.address,li.country,li.city,li.state,li.zipCode,li.companyEmployeeSize,li.industry,li.assetName,li." + keys.join(',li.') + ",lis.status,lr.reason from lead_info li left join lead_info_status lis ON li.leadInfoID=lis.leadInfoID  left join lead_info_reason lr ON li.leadInfoID=lr.leadInfoID where li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status in (?) group by li.leadInfoID";//Supriya Task:3075 - grouping by leadInfoID because sometimes result have leadInfoID multiple
           pool.query(sql, [statusArray], function (error, leadResult, fields) {
             if (error) {
               log.error("Error Publisher/publisherDownloadAcceptedLeadDetails:" + error);
               return res.status(400).json(error);
             }
             else {
               const leadLength = leadResult.length;
               for (let i = 0; i < leadLength; i++) {
                 leadResult[i].assetName = unescape(leadResult[i].assetName);
                 var email = leadResult[i].email;
                 if (email.includes("@") == false) {
                   leadResult[i].email = cryptr.decrypt(leadResult[i].email);
                   leadResult[i].firstName = cryptr.decrypt(leadResult[i].firstName);
                   leadResult[i].lastName = cryptr.decrypt(leadResult[i].lastName);
                   leadResult[i].workPhone = cryptr.decrypt(leadResult[i].workPhone);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch1')) {
                   let touch1 = "assetNameTouch1";
                   leadResult[i][touch1] = unescape(leadResult[i][touch1]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch2')) {
                   let touch2 = "assetNameTouch2";
                   leadResult[i][touch2] = unescape(leadResult[i][touch2]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch3')) {
                   let touch3 = "assetNameTouch3";
                   leadResult[i][touch3] = unescape(leadResult[i][touch3]);
                 }
               }//End of for loop leadResult
               if (leadLength > 0) {
                //Supriya Task:3075 - using common function for lead key change as per mapping
                new Promise(async (reject) => {
                 //Supriya Task:3075 - add try/catch block to call function
                 try {
                   //Supriya Task:3075 - use async/await function for wait still get result
                   leadResult = await uploadLeadFunction.leadDownloadFunction(leadResult, mappingResult, deliveryResult);
                 
                 } catch (error) { reject(error) }//End of catch block
               })//End of Promise
 
 
                 const leadCQLength = leadQuestionResult.length;
                 for (let i = 0; i < leadLength; i++) {
                   for (let j = 0; j < leadCQLength; j++) {
                     if (leadResult[i].leadInfoID === leadQuestionResult[j].leadInfoID) {
                       let question = 'CQ -' + unescape(leadQuestionResult[j].customQuestion);
                       let answer = unescape(leadQuestionResult[j].answer);
                       leadResult[i][question] = answer;
                     }
                   }// End of leadQuestionResult loop
                 }// End of LeadResult loop
 
                 setTimeout(() => {
                   leadResult.map(function (leadReasult) {
                     leadReasult['Lead Info ID'] = leadReasult["leadInfoID"];
                     delete leadReasult["leadInfoID"];
 
                     leadReasult['Status'] = leadReasult["status"];
                     delete leadReasult["status"];
 
                     leadReasult['Reason'] = leadReasult["reason"];
                     delete leadReasult["reason"];
 
                     leadReasult['Voice Log Link'] = leadReasult["voiceLogLink"];
                     delete leadReasult["voiceLogLink"];
                     return leadReasult;
                   });
                   res.send(JSON.stringify(leadResult));
                 }, 1000)
               } else {
                 let success = "No Data Exists";
                 res.json({ success: true, message: success });
               }
             }
           });//End of leadResult 
         }, timeout)
       });//End of Delivery_Format_Mapping
     });//End of lead_Custom_Question
   });//End of delivery_format
 });//End of publisherDownloadAcceptedLeadDetails
 
 
 /* @author Narendra Phadke
   * @param  Description Download the rejected lead details
   * @return Description return excel file for download
   */
 router.post('/publisherDownloadRejectedLeadDetails', authCheck,function (req, res, next) {
   log.info("In Publisher/publisherDownloadRejectedLeadDetails");
   // leadDisplay.leadDisplay(res,leadDetails);
   var assetRemovalStatus = properties.get('agencyStatus.asset.REJECT_ASSET_REMOVED');
   var leadStatus1 = properties.get('download.rejected.status');
   var leadStatus2 = properties.get('reviewLead.pubRejected.status')
   var publisherQARejected = properties.get('reviewLead.publisherQARejected.status')
   var agencyQARejected = properties.get('reviewLead.agencyQARejected.status');
   var DI_QA_Rejected = properties.get('reviewLead.rejectedDI.status');
   var clientRejected = properties.get('clientReviewLead.clientRejected.status');
   var REJECT_DUE_TO_UPDATE = properties.get('reviewLead.REJECT_DUE_TO_UPDATE.status');
   var campID = req.body.campID;
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
   let statusArray = [leadStatus1, leadStatus2, clientRejected, assetRemovalStatus, publisherQARejected, agencyQARejected, DI_QA_Rejected, REJECT_DUE_TO_UPDATE]
   let timeout = 50;
   let sql1 = "select d.campID,d.campaignID,d.reAllocationID,d.leadInteractionDate,d.firstName,d.lastName,d.companyName,d.linkedInCompanyName,d.email,d.workPhone,d.jobTitle,d.linkedInJobTitle,d.jobLevel,d.jobFunction,d.country,d.address,d.street,d.city,d.state,d.zipCode,d.companyEmployeeSize,d.companyRevenue,d.industry,d.ip,d.supportDocID,d.assetName,d.assetNameTouch1,d.assetTimestampTouch1,d.assetNameTouch2,d.assetTimestampTouch2,d.assetNameTouch3,d.assetTimestampTouch3,d.extra1,d.extra2,d.extra3,d.extra4,d.extra5,d.linkedIn,d.comments,d.alternatePhoneNo,d.domain,d.additionalComments,c.callAudit,c.multiTouch from delivery_format d join campaign c on d.campID=c.campID  where d.campID='" + campID + "' "
   pool.query(sql1, function (error, deliveryResult, fields) {
     if (error) {
       log.error("Error Publisher/publisherDownloadRejectedLeadDetails:" + error);
       return res.status(400).json(error);
     }
     let leadCQ = "SELECT cq.campID as parentCampID,cq.leadInfoID,cq.customQuestion,cq.answer from lead_custom_questions cq left join lead_info_status lis ON cq.leadInfoID=lis.leadInfoID join campaign c on cq.campID=c.campID where  cq.campID='" + campID + "' AND cq.pID='" + pID + "' AND lis.status in (?)";
     pool.query(leadCQ, [statusArray], function (error, leadQuestionResult, fields) {
       if (error) {
         log.error("Error Publisher/publisherDownloadRejectedLeadDetails:" + error);
         return res.status(400).json(error);
       }
 
       let dfMapping = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "'";
       pool.query(dfMapping, function (error, mappingResult, fields) {
         if (error) {
           log.error("Error Publisher/publisherDownloadRejectedLeadDetails:" + error);
           return res.status(400).json(error);
         }
         deliveryResult = JSON.parse(JSON.stringify(deliveryResult).split('"campaignID":').join('"campID":'));
         var yesStatus = properties.get('deliveryFormatStatus.yes.status');
         let campaignArray = {};
         if (deliveryResult[0].reAllocationID === yesStatus) {
           campaignArray['reAllocationID'] = "";
         }
         if (deliveryResult[0].jobLevel === yesStatus) {
           campaignArray['jobLevel'] = "";
         }
         if (deliveryResult[0].jobFunction === yesStatus) {
           campaignArray['jobFunction'] = "";
         }
         if (deliveryResult[0].industry === yesStatus) {
           campaignArray['industry'] = "";
         }
         if (deliveryResult[0].companyEmployeeSize === yesStatus) {
           campaignArray['companyEmployeeSize'] = "";
         }
         if (deliveryResult[0].street === yesStatus) {//Somnath Task:3002, Add street if checked
           campaignArray['street'] = "";
         }
         if (deliveryResult[0].companyRevenue === yesStatus) {
           campaignArray['companyRevenue'] = "";
         }
         if (deliveryResult[0].ip === yesStatus) {
           campaignArray['ip'] = "";
         }
         if (deliveryResult[0].supportDocID === yesStatus) {
           campaignArray['supportDocID'] = "";
         }
         if (deliveryResult[0].callAudit === 'Yes') {
           campaignArray['voiceLogLink'] = "";
         }
         if (deliveryResult[0].extra1 === yesStatus) {
           campaignArray['extra1'] = "";
         }
         if (deliveryResult[0].extra2 === yesStatus) {
           campaignArray['extra2'] = "";
         }
         if (deliveryResult[0].extra3 === yesStatus) {
           campaignArray['extra3'] = "";
         }
         if (deliveryResult[0].extra4 === yesStatus) {
           campaignArray['extra4'] = "";
         }
         if (deliveryResult[0].extra5 === yesStatus) {
           campaignArray['extra5'] = "";
         }
         if (deliveryResult[0].domain === yesStatus) {
           campaignArray['domain'] = "";
         }
         if (deliveryResult[0].alternatePhoneNo === yesStatus) {
           campaignArray['alternatePhoneNo'] = "";
         }
         if (deliveryResult[0].linkedIn === yesStatus) {
           campaignArray['linkedIn'] = "";
         }
         if (deliveryResult[0].comments === yesStatus) {
           campaignArray['comments'] = "";
         }
         if (deliveryResult[0].multiTouch === yesStatus) {
           timeout = 500;
           let sql = "select supportDocID,suppDocName,campID,typeOfSuppDoc,multiTouch from supporting_document where campID='" + campID + "'and typeOfSuppDoc='Asset' and (status!='Removed' or status is null)"
           var multiTouchAsset = "";
           pool.query(sql, function (err, resultsAsset, fields) {
             if (err) {
               log.error("Error Publisher/publisherDownloadRejectedLeadDetails:" + error);
               return res.status(400).json(error);
             }
             else {
               var assetTouch1 = "", assetTouch2 = "", assetTouch3 = "";
               for (var i = 0; i < resultsAsset.length; i++) {
                 if (resultsAsset[i].multiTouch == "1st Touch") {
                   assetTouch1 = assetTouch1 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "2nd Touch") {
                   assetTouch2 = assetTouch2 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "3rd Touch") {
                   assetTouch3 = assetTouch3 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 multiTouchAsset = multiTouchAsset + "|" + resultsAsset[i].multiTouch;
               }
               var onlyNum = (multiTouchAsset.match(/\d+/g).map(Number)).toString();
               onlyNum = onlyNum.split(',');
               var maxNum = Math.max(...onlyNum);
               if (maxNum === 3) {
                 three = true;
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 campaignArray['assetNameTouch3'] = "";
                 campaignArray['assetTimestampTouch3'] = "";
               }
               if (maxNum === 2) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 two = true;
               }
               if (maxNum === 1) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 one = true;
               }
             }
           });
         }
         else {
           campaignArray['assetName'] = "";
         }
         setTimeout(() => {
           let keys = Object.keys(campaignArray);
           let sql = "select li.leadInfoID,li.campID,li.pID,li.leadInteractionDate,li.firstName,li.lastName,li.email,li.companyName,li.linkedInCompanyName,li.workPhone,li.jobTitle,li.linkedInJobTitle,li.address,li.country,li.city,li.state,li.zipCode,li.companyEmployeeSize,li.industry,li.assetName,li." + keys.join(',li.') + ",lis.status,lr.reason from lead_info li left join lead_info_status lis ON li.leadInfoID=lis.leadInfoID  left join lead_info_reason lr ON li.leadInfoID=lr.leadInfoID where li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status in (?) group by li.leadInfoID";//Supriya Task:3075 - grouping by leadInfoID because sometimes result have leadInfoID multiple
           pool.query(sql, [statusArray], function (error, leadResult, fields) {
             if (error) {
               log.error("Error Publisher/publisherDownloadRejectedLeadDetails:" + error);
               return res.status(400).json(error);
             }
             else {
               const leadLength = leadResult.length;
               for (let i = 0; i < leadLength; i++) {
                 leadResult[i].assetName = unescape(leadResult[i].assetName);
                 var email = leadResult[i].email;
                 if (email.includes("@") == false) {
                   leadResult[i].email = cryptr.decrypt(leadResult[i].email);
                   leadResult[i].firstName = cryptr.decrypt(leadResult[i].firstName);
                   leadResult[i].lastName = cryptr.decrypt(leadResult[i].lastName);
                   leadResult[i].workPhone = cryptr.decrypt(leadResult[i].workPhone);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch1')) {
                   let touch1 = "assetNameTouch1";
                   leadResult[i][touch1] = unescape(leadResult[i][touch1]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch2')) {
                   let touch2 = "assetNameTouch2";
                   leadResult[i][touch2] = unescape(leadResult[i][touch2]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch3')) {
                   let touch3 = "assetNameTouch3";
                   leadResult[i][touch3] = unescape(leadResult[i][touch3]);
                 }
               }//End of for loop leadResult
 
               if (leadLength > 0) {
                  //Supriya Task:3075 - using common function for lead key change as per mapping
                  new Promise(async (reject) => {
                   //Supriya Task:3075 - add try/catch block to call function
                   try {
                     //Supriya Task:3075 - use async/await function for wait still get result
                     leadResult = await uploadLeadFunction.leadDownloadFunction(leadResult, mappingResult, deliveryResult);
                
                   } catch (error) { reject(error) }//End of catch block
                 })//End of Promise
       
                 const leadCQLength = leadQuestionResult.length;
                 for (let i = 0; i < leadLength; i++) {
                   for (let j = 0; j < leadCQLength; j++) {
                     if (leadResult[i].leadInfoID === leadQuestionResult[j].leadInfoID) {
                       let question = 'CQ -' + unescape(leadQuestionResult[j].customQuestion);
                       let answer = unescape(leadQuestionResult[j].answer);
                       leadResult[i][question] = answer;
                     }
                   }// End of leadQuestionResult loop
                 }// End of LeadResult loop
                 setTimeout(() => {
                   leadResult.map(function (leadReasult) {
                     leadReasult['Lead Info ID'] = leadReasult["leadInfoID"];
                     delete leadReasult["leadInfoID"];
 
                     leadReasult['Status'] = leadReasult["status"];
                     delete leadReasult["status"];
 
                     leadReasult['Reason'] = leadReasult["reason"];
                     delete leadReasult["reason"];
 
                     leadReasult['Voice Log Link'] = leadReasult["voiceLogLink"];
                     delete leadReasult["voiceLogLink"];
                     return leadReasult;
                   });
                   res.send(JSON.stringify(leadResult));
                 }, 1000)
               } else {
                 let success = "No Data Exists";
                 res.json({ success: true, message: success });
               }
             }
           });//End of leadResult 
         }, timeout)
       });//End of Delivery_Format_Mapping
     });//End of lead_Custom_Question
   });//End of delivery_format
 });//End of publisherDownloadRejectedLeadDetails
 
 /**
  * @author Supriya Gore - Task:3091
  * @param  Description common function created for download lead from dashboard delivery status
  * @return Description return leads
  */
//sonali-3922-added -authcheck keyword missing
 router.post('/publisherDownloadLead',authCheck,function (req, res, next) {
   log.info("In publisher/publisherDownloadLead");
   var leadStatus = properties.get('download.QA_Review.status');
   var leadStatus1 = properties.get('download.accepted.status');
   var leadDelivered = properties.get('clientReviewLead.clientAccepted.status');
   var leadRejected = properties.get('download.clientRejected.status');
   var agencyRejected = properties.get('download.rejected.status');
   var rejected = properties.get('reviewLead.pubRejected.status')
   var publisherQARejected = properties.get('reviewLead.publisherQARejected.status');
   var DI_QA_Accepted = properties.get('reviewLead.acceptedDI.status');
   var DI_QA_Rejected = properties.get('reviewLead.rejectedDI.status');
   var agencyQARejected = properties.get('reviewLead.agencyQARejected.status');
   var DI_QA_Review = properties.get('download.DI_Review.status');
   var assetRemovalStatus = properties.get('agencyStatus.asset.REJECT_ASSET_REMOVED');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var clientRejected = properties.get('clientReviewLead.clientRejected.status');
   var REJECT_DUE_TO_UPDATE = properties.get('reviewLead.REJECT_DUE_TO_UPDATE.status');
 
   const { campID, leadType } = req.body;
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
   let statusArray = [];
   if (leadType == "Delivered") {
     statusArray = [leadStatus, leadStatus1, leadDelivered, leadRejected, rejected, agencyRejected, agencyInternalReview, assetRemovalStatus, publisherQARejected, agencyQARejected, DI_QA_Accepted, DI_QA_Rejected, DI_QA_Review];
   } else if (leadType == "Review-Pending") {
     statusArray = [leadStatus, agencyInternalReview, DI_QA_Review];
   }
   else if (leadType == "Accepted") {
     statusArray = [leadStatus1, leadDelivered, DI_QA_Accepted];
   }
   else if (leadType == "Rejected") {
     statusArray = [agencyRejected, rejected, clientRejected, assetRemovalStatus, publisherQARejected, agencyQARejected, DI_QA_Rejected, REJECT_DUE_TO_UPDATE];
   }
   let timeout = 50;
   const promise1 = new Promise((resolve, reject) => {
     //Somnath Task-3137, Add Extra fileds in SQL
     let sql1 = "select c.customQuestionAliasName,d.campID,d.campaignName,d.campaignID,d.reAllocationID,d.leadInteractionDate,d.firstName,d.lastName,d.companyName,d.linkedInCompanyName,d.email,d.workPhone,d.jobTitle,d.linkedInJobTitle,d.jobLevel,d.jobFunction,d.country,d.address,d.street,d.city,d.state,d.zipCode,d.companyEmployeeSize,d.companyRevenue,d.industry,d.ip,d.supportDocID,d.assetName,d.assetNameTouch1,d.assetTimestampTouch1,d.assetNameTouch2,d.assetTimestampTouch2,d.assetNameTouch3,d.assetTimestampTouch3,d.extra1,d.extra2,d.extra3,d.extra4,d.extra5,d.extra6,d.extra7,d.extra8,d.extra9,d.extra10,d.extra11,d.extra12,d.extra13,d.extra14,d.extra15,d.extra16,d.extra17,d.extra18,d.extra19,d.extra20,d.linkedIn,d.comments,d.alternatePhoneNo,d.domain,d.additionalComments,c.callAudit,c.multiTouch from delivery_format d join campaign c on d.campID=c.campID  where d.campID='" + campID + "' "
     pool.query(sql1, function (error, deliveryResult, fields) {
       if (error) {
         reject("promise1:" + error)
         return res.status(400).json(error);
       } else {
         resolve(deliveryResult)
       }
     })
   })// End of promise1
   const promise2 = new Promise((resolve, reject) => {
     let leadCQ = "SELECT cq.campID as parentCampID,cq.leadInfoID,cq.aliasName,cq.customQuestion,cq.answer from lead_custom_questions cq left join lead_info_status lis ON cq.leadInfoID=lis.leadInfoID join campaign c on cq.campID=c.campID where  cq.campID='" + campID + "' AND cq.pID='" + pID + "' AND lis.status in (?)";
     pool.query(leadCQ, [statusArray], function (error, leadQuestionResult, fields) {
       if (error) {
         reject("promise2:" + error)
         return res.status(400).json(error);
       } else {
         resolve(leadQuestionResult);
       }
     })
   })//End of promise2
 
   const promise3 = new Promise((resolve, reject) => {
     let sql = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "'";
     pool.query(sql, function (error, mappingResult, fields) {
       if (error) {
         reject("promise3:" + error)
         return res.status(400).json(error);
       } else {
         resolve(mappingResult)
       }
     })
   })//End of Promise3
 
   Promise.all([promise1, promise2, promise3]).then((result) => {
     let deliveryResult = [], leadQuestionResult = [], mappingResult = [];
     deliveryResult = result[0];
     leadQuestionResult = result[1];
     mappingResult = result[2];
     deliveryResult = JSON.parse(JSON.stringify(deliveryResult).split('"campaignID":').join('"campID":'));
     var yesStatus = properties.get('deliveryFormatStatus.yes.status');
     let campaignArray = {};
     if (deliveryResult[0].reAllocationID === yesStatus) {
       campaignArray['reAllocationID'] = "";
     }
     if (deliveryResult[0].jobLevel === yesStatus) {
       campaignArray['jobLevel'] = "";
     }
     if (deliveryResult[0].jobFunction === yesStatus) {
       campaignArray['jobFunction'] = "";
     }
     if (deliveryResult[0].industry === yesStatus) {
       campaignArray['industry'] = "";
     }
     if (deliveryResult[0].companyEmployeeSize === yesStatus) {
       campaignArray['companyEmployeeSize'] = "";
     }
     if (deliveryResult[0].street === yesStatus) {//Somnath Task No:3002, Add street if checked
       campaignArray['street'] = "";
     }
     if (deliveryResult[0].companyRevenue === yesStatus) {
       campaignArray['companyRevenue'] = "";
     }
     if (deliveryResult[0].ip === yesStatus) {
       campaignArray['ip'] = "";
     }
     if (deliveryResult[0].supportDocID === yesStatus) {
       campaignArray['supportDocID'] = "";
     }
     if (deliveryResult[0].callAudit === 'Yes') {
       campaignArray['voiceLogLink'] = "";
     }
     if (deliveryResult[0].extra1 === yesStatus) {
       campaignArray['extra1'] = "";
     }
     if (deliveryResult[0].extra2 === yesStatus) {
       campaignArray['extra2'] = "";
     }
     if (deliveryResult[0].extra3 === yesStatus) {
       campaignArray['extra3'] = "";
     }
     if (deliveryResult[0].extra4 === yesStatus) {
       campaignArray['extra4'] = "";
     }
     if (deliveryResult[0].extra5 === yesStatus) {
       campaignArray['extra5'] = "";
     }
     //Somnath-Task-3137, Add Extra Fields
     if (deliveryResult[0].extra6 === yesStatus) {
       campaignArray['extra6'] = "";
     }
     if (deliveryResult[0].extra7 === yesStatus) {
       campaignArray['extra7'] = "";
     }
     if (deliveryResult[0].extra8 === yesStatus) {
       campaignArray['extra8'] = "";
     }
     if (deliveryResult[0].extra9 === yesStatus) {
       campaignArray['extra9'] = "";
     }
     if (deliveryResult[0].extra10 === yesStatus) {
       campaignArray['extra10'] = "";
     }
     if (deliveryResult[0].extra11 === yesStatus) {
       campaignArray['extra11'] = "";
     }
     if (deliveryResult[0].extra12 === yesStatus) {
       campaignArray['extra12'] = "";
     }
     if (deliveryResult[0].extra13 === yesStatus) {
       campaignArray['extra13'] = "";
     }
     if (deliveryResult[0].extra14 === yesStatus) {
       campaignArray['extra14'] = "";
     }
     if (deliveryResult[0].extra15 === yesStatus) {
       campaignArray['extra15'] = "";
     }
     if (deliveryResult[0].extra16 === yesStatus) {
       campaignArray['extra16'] = "";
     }
     if (deliveryResult[0].extra17 === yesStatus) {
       campaignArray['extra17'] = "";
     }
     if (deliveryResult[0].extra18 === yesStatus) {
       campaignArray['extra18'] = "";
     }
     if (deliveryResult[0].extra19 === yesStatus) {
       campaignArray['extra19'] = "";
     }
     if (deliveryResult[0].extra20 === yesStatus) {
       campaignArray['extra20'] = "";
     }
     if (deliveryResult[0].domain === yesStatus) {
       campaignArray['domain'] = "";
     }
     if (deliveryResult[0].alternatePhoneNo === yesStatus) {
       campaignArray['alternatePhoneNo'] = "";
     }
     if (deliveryResult[0].linkedIn === yesStatus) {
       campaignArray['linkedIn'] = "";
     }
     if (deliveryResult[0].comments === yesStatus) {
       campaignArray['comments'] = "";
     }
     if (deliveryResult[0].multiTouch === yesStatus) {
       timeout = 700;
       let sql = "select supportDocID,suppDocName,campID,typeOfSuppDoc,multiTouch from supporting_document where campID='" + campID + "'and typeOfSuppDoc='Asset' and (status!='Removed' or status is null)"
       var multiTouchAsset = "";
       pool.query(sql, function (err, resultsAsset, fields) {
         if (err) {
           log.error("Error publisher/publisherDownloadLead:" + error);
           return res.status(400).json(error);
         }
         else {
           var assetTouch1 = "", assetTouch2 = "", assetTouch3 = "";
           for (var i = 0; i < resultsAsset.length; i++) {
             if (resultsAsset[i].multiTouch == "1st Touch") {
               assetTouch1 = assetTouch1 + "|" + unescape(resultsAsset[i].suppDocName);
             }
             if (resultsAsset[i].multiTouch == "2nd Touch") {
               assetTouch2 = assetTouch2 + "|" + unescape(resultsAsset[i].suppDocName);
             }
             if (resultsAsset[i].multiTouch == "3rd Touch") {
               assetTouch3 = assetTouch3 + "|" + unescape(resultsAsset[i].suppDocName);
             }
             multiTouchAsset = multiTouchAsset + "|" + resultsAsset[i].multiTouch;
           }
           var onlyNum = (multiTouchAsset.match(/\d+/g).map(Number)).toString();
           onlyNum = onlyNum.split(',');
           var maxNum = Math.max(...onlyNum);
           if (maxNum === 3) {
             three = true;
             campaignArray['assetNameTouch1'] = "";
             campaignArray['assetTimestampTouch1'] = "";
             campaignArray['assetNameTouch2'] = "";
             campaignArray['assetTimestampTouch2'] = "";
             campaignArray['assetNameTouch3'] = "";
             campaignArray['assetTimestampTouch3'] = "";
           }
           if (maxNum === 2) {
             campaignArray['assetNameTouch1'] = "";
             campaignArray['assetTimestampTouch1'] = "";
             campaignArray['assetNameTouch2'] = "";
             campaignArray['assetTimestampTouch2'] = "";
             two = true;
           }
           if (maxNum === 1) {
             campaignArray['assetNameTouch1'] = "";
             campaignArray['assetTimestampTouch1'] = "";
             one = true;
           }
         }
       });
     }
     else {
       campaignArray['assetName'] = "";
     }
     setTimeout(() => {
       let keys = Object.keys(campaignArray);
       //Somnath Task-3137, Join campaign Table to get campaign info
       let sql = "select li.leadInfoID,li.campID,c.campaignName,li.pID,li.leadInteractionDate,li.firstName,li.lastName,li.email,li.companyName,li.linkedInCompanyName,li.workPhone,li.jobTitle,li.linkedInJobTitle,li.address,li.country,li.city,li.state,li.zipCode,li.companyEmployeeSize,li.industry,li.assetName,li." + keys.join(',li.') + ",lis.status,lr.reason from lead_info li left join lead_info_status lis ON li.leadInfoID=lis.leadInfoID  left join lead_info_reason lr ON li.leadInfoID=lr.leadInfoID join campaign c on c.campID=li.campID where li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status in (?) group by li.leadInfoID";
       pool.query(sql, [statusArray], function (error, leadResult, fields) {
         if (error) {
           log.error("Error publisher/publisherDownloadLead:" + error);
           return res.status(400).json(error);
         }
         else {
           const leadLength = leadResult.length;
           for (let i = 0; i < leadLength; i++) {
             leadResult[i].assetName = unescape(leadResult[i].assetName);
             var email = leadResult[i].email;
             if (email.includes("@") == false) {
               leadResult[i].email = cryptr.decrypt(leadResult[i].email);
               leadResult[i].firstName = cryptr.decrypt(leadResult[i].firstName);
               leadResult[i].lastName = cryptr.decrypt(leadResult[i].lastName);
               leadResult[i].workPhone = cryptr.decrypt(leadResult[i].workPhone);
             }
             if (leadResult[i].hasOwnProperty('assetNameTouch1')) {
               let touch1 = "assetNameTouch1";
               leadResult[i][touch1] = unescape(leadResult[i][touch1]);
             }
             if (leadResult[i].hasOwnProperty('assetNameTouch2')) {
               let touch2 = "assetNameTouch2";
               leadResult[i][touch2] = unescape(leadResult[i][touch2]);
             }
             if (leadResult[i].hasOwnProperty('assetNameTouch3')) {
               let touch3 = "assetNameTouch3";
               leadResult[i][touch3] = unescape(leadResult[i][touch3]);
             }
           }//End of for loop leadResult
             //Supriya Task:3091 - using common function for lead key change as per mapping
             new Promise(async (reject) => {
               //Supriya Task:3091 - add try/catch block to call function
               try {
                 if (leadLength > 0) {
                   //Supriya Task:3091 - use async/await function for wait still get result
                   var role = "PC";
                   leadResult = await uploadLeadFunction.leadDownloadFunction(leadResult, mappingResult, deliveryResult, leadQuestionResult, role);
                   res.send(JSON.stringify(leadResult));
                 } else {
                     var success = "No Data Exists";
                     res.json({ success: true, message: success });
                   }
               } catch (error) { reject(error) }//End of catch block
             })//End of Promise
         }
       });//End of leadResult 
     }, timeout)
   }).catch((error) => {
     log.error("Error publisher/publisherDownloadLead:" + error)
   })
 });// End of publisherDownloadLead
 
 // /**
 //  * @author Ram Chander
 //  * @param  Description This will extract the lead delivery status on basis of publisher ID
 //  * @return Description return delivered lead status
 //  */
 // router.get("/pubDeliveryStatus", function(req, res, next) {
 //   //var campID = url.parse(req.url, true).query.campID;
 //   var pID = url.parse(req.url, true).query.pID;
 
 //   var query = "SELECT campID, delieveredLead,acceptedLead,rejectedLead,balance, ROUND((acceptedLead/(acceptedLead+balance)*100)) AS percentage FROM lead_info_temp WHERE pID='"+pID+"'";
 
 //   res.locals.connection.query( query,
 
 //     function(error, results, fields) {
 //       if (error) {
 //         return res.status(400).json(errors);
 //         }
 //     else{      
 //         res.send(JSON.stringify(results));
 //         }
 
 //     }
 //   );
 //   //
 // });
 
 
 
 /*@author somnath keswad
  * Desc Reject the campaign and CPL to the by the Publisher
  
  Date:11/03/2019
  */
 router.post("/rejectCampaign", authCheck,function (req, res, next) {
   log.info("inside rejectCampaign");
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
   var allocationID = req.body.campaignDetail[0].allocationID;
   var campID = req.body.campaignDetail[0].campID;
   var allocatedLead = req.body.allocatedLead;
   var allocatingInProgress = properties.get('agencyStatus.partialAllocation');
   var reject = properties.get('pubStatus.rejectCampaign');
   var reason = req.body.reason;
   if (reason == undefined || reason == null) { reason = ''; }
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
 
 
   var description=campaignTraceProperties.get('campaign.publisher.reject');//Sonali-3257-get details from properties file
 
   var firstName = user.firstName;
   var lastName = user.lastName;
 
 
   /**
   * @author Narendra Phadke
   * @param  Description handle the Email functionality
   * @return Description return All Email
   */
 
 
   var campaignDetail = req.body.campaignDetail;
 
   var success;
   var errors;
 
   var user_role = "AC";
 
   //get all agency details from user_details table
   var query = "select ud.userID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' and ud.orgID='" + campaignDetail[0].agencyID + "' and ec.rejectCampaign='" + emailConfigYes + "') OR (ud.role='PC' and ud.orgID='" + pID + "' and ec.rejectCampaign='" + emailConfigYes + "')";
   pool.query(query, function (error, results, fields) {
     if (error) {
       log.error("Error inside rejectCampaign==>" + error);
       throw error;
     }
     email.rejectMail(user, results, campaignDetail, reason, allocatedLead);
   }
   );
 
   try {
     /*@author somnath keswad
   * Desc Update the status, Reason, lastUpdated in publisher_allocation Table for Reject Campaign
   Date:11/03/2019
   */
 
     var sql = "UPDATE publisher_allocation SET status ='" + reject + "',reasonOfRejection ='" + escape(reason) + "',lastUpdated='" + formatted + "' WHERE allocationID ='" + allocationID + "'";
     pool.query(sql, function (error, results, fields) {
       if (error) {
         log.error("Error inside rejectCampaign 1==>" + error);
 
         errors.publisher = "Campaign Not Rejected";
         return res.status(400).json(errors);
       } else {
 
 
       }
     });
     pool.query("update campaign set status='" + allocatingInProgress + "',lastUpdated ='" + formatted + "' where campID='" + campID + "'", function (error, results, fields) {
       if (error) {
         log.error("Error inside rejectCampaign 2==>" + error);
 
         return res.status(400).json(errors);
       }
     });
 
     /**
     * @author Narendra Phadke
     * @param  Description handle the Alerts Functionality 
     * @return Description return insert alerts
     */
 
     let description = propertiesNotification.get('publisher.reject.notification');
     let messageStatus = properties.get('Message.Unread');
     let queryAlerts = "insert into conversation_alerts SET ?",
       values = {
         campID: campID,
         agencyID: campaignDetail[0].agencyID,
         pID: user.id,
         advertiserID: 0,
         userID: user.userID,
         sender: user.id,
         receiver: campaignDetail[0].agencyID,
         description: description,
         status: messageStatus,
         created: formatted,
         lastUpdated: formatted
       };
 
     pool.query(queryAlerts, values, function (error, results, fields) {
       if (error) {
         log.error("Alerts inside campaign reject by publisher Error==" + error);
       } else {
       }
     });
 
 
     var query = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + campaignDetail[0].agencyID + "','" + pID + "','" + allocatingInProgress + "','" + description + "','" + user.userID + "','" + firstName + "','" + lastName + "','" + formatted + "')";
     pool.query(query, function (error, results, fields) {
       if (error) {
         log.error("Error inside rejectCampaign 3==>" + error);
 
         return res.status(400).json(errors);
       }
     }
     );
   } catch (error) {
     errors.publisher = "Campaign Not Rejected";
     return res.status(400).json(errors);
   }
   success = 'Campaign rejected successfully';
   res.json({ success: true, message: success });
 
 
   //
 });
 
 
 
 /*@author Sanjana Godbole
  * Counter  the campaign for CPL and Leads
  
  Date:18/03/2019
  */
 router.post("/counterCampaign", function (req, res, next) {
   log.info("inside counterCampaign");
   var pID = req.body.pID;
   var allocationID = req.body.allocationID;
 
   var campID = req.body.campaignDetail[0].campID;
 
   //var allocatedLead = req.body.allocatedLead;
   var userName = req.body.user;
 
   var reason = req.body.reason;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var status = "Counter";
   var status1 = "Assign";
   var description=campaignTraceProperties.get('campaign.publisher.counter');//Sonali-3257-get details from properties file
 
   var clientCampID = req.body.campaignDetail[0].clientCampID;
   var user_ID = req.body.user.id;
   var firstName = req.body.user.firstName;
   var lastName = req.body.user.lastName;
   var proposedLead = req.body.proposedLead;
 
   var proposedCPL = req.body.proposedCPL;
   proposedCPL = parseFloat(proposedCPL).toFixed(2);
 
 
   /**
   * @author Narendra Phadke
   * @param  Description handle the Email functionality
   * @return Description return All Email
   */
 
   var user = req.body.user;
   var campaignDetail = req.body.campaignDetail;
 
   var success;
   var errors;
   var user_role = "AC";
 
   try {
     /*@author Sanjana  Godbole
     /* Desc Update the status,counterLead , counterCPL ,lastUpdated in publisher_allocation Table for Counter Campaign
   Date:18/03/2019
   */
     var sql = "UPDATE publisher_allocation SET status ='" + status + "',counterLead ='" + proposedLead + "',counterCPL ='" + proposedCPL + "',lastUpdated='" + formatted + "' WHERE allocationID ='" + allocationID + "'";
 
     pool.query(sql, function (error, results, fields) {
       if (error) {
         log.error("Error inside counterCampaign==>" + error);
         errors.publisher = "Campaign Not Counter";
         return res.status(400).json(errors);
       } else {
 
         var query = "select ud.userID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "'and ud.orgID='" + campaignDetail[0].agencyID + "' and ec.counterCampaign='" + emailConfigYes + "') OR (ud.role='PC'and ud.orgID='" + pID + "' and ec.counterCampaign='" + emailConfigYes + "')";
         pool.query(query, function (error, results, fields) {
           if (error) {
             log.error("Error inside counterCampaign 1==>" + error);
 
             return res.status(400).json(errors);
           }
           else {
             success = "Campaign Counter Submitted successfully";
             res.json({ success: true, message: success });
             email.counterMail(user, results, campaignDetail, proposedLead, proposedCPL);
           }
         }
         );//
       }
     }
     );
 
     /*@author somnath keswad
     * Desc Insert the record in log Table
      Date:11/03/2019
     */
 
     var query = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + campaignDetail[0].agencyID + "','" + pID + "','" + status + "','" + description + "','" + user.userID + "','" + firstName + "','" + lastName + "','" + formatted + "')";
     pool.query(query,
       function (error, results, fields) {
         if (error) {
 
           throw error;
         }
       });
   } catch (error) {
     errors.publisher = "Campaign Not Counter";
     return res.status(400).json(errors);
   }
 
 
 });
 
 /*@author somnath keswad
 * Desc Reassign the rejected Campaign to publisher in allocated campaign Tab
 Date:14/03/2019
 */
 router.post("/reassignCampaign", function (req, res, next) {
   log.info("inside reassignCampaign");
   var success;
   var errors;
   /***For Email functionality***/
   var user = req.body.user;
   let campaignDetail = [];
   /****End */
   var rejectStatus = "Reject";
   var reAssign = "ReAssign";
   var reject = "Reject";
   var campID = req.body.campID;
   var alLeads = 0;
   var leadAllocation = req.body.leadAllocation;
   var leadAllocationCamp = parseInt(leadAllocation);
   var status = "Assign";
   var stat1 = "AllocatingInProgress";
   var stat2 = "Assign";
   var a = [], pubAllocatedLead, c;
   var description=campaignTraceProperties.get('campaign.allocation.rejected');//Sonali-3257-get details from properties file
 
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
   const result = Array.from(new Set(newDynamicArray.map(p => p.pID))).map(pID => {
     return {
       pID: pID,
       publisherName: newDynamicArray.find(p => p.pID === pID).publisherName,
       startDate: newDynamicArray.find(p => p.pID === pID).startDate,
       endDate: newDynamicArray.find(p => p.pID === pID).endDate,
       allocatedLead: newDynamicArray.find(p => p.pID === pID).allocatedLead,
       cpl: newDynamicArray.find(p => p.pID === pID).cpl != null ? newDynamicArray.find(p => p.pID === pID).cpl : newDynamicArray.find(p => p.pID === pID).campCPL,
       firstLeadDeliveryDate: newDynamicArray.find(p => p.pID === pID).firstLeadDeliveryDate
 
     };
   });
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var status = "Assign";
   for (var i = 0, l = result.length; i < l; i++) {
 
     if (result[i].allocatedLead == undefined || result[i].allocatedLead == '') {
     }
     else {
       /********For Email Functionality */
       /***** */
       // In else Block for comparision for allocated leads and lead allocation
       try {
         var sql = "insert into publisher_allocation (pID,campID,startDate,endDate,firstLeadDeliveryDate,allocatedLead,CPL,created,lastUpdated,status) values('" + result[i].pID + "','" + req.body.campID + "','" + result[i].startDate + "','" + result[i].endDate + "','" + result[i].firstLeadDeliveryDate + "','" + result[i].allocatedLead + "','" + parseFloat(result[i].cpl).toFixed(2) + "','" + formatted + "','" + formatted + "','" + status + "')";
         pool.query(sql, function (err, results, fields) {
           if (err) {
             log.error("Error inside reassignCampaign==>" + err);
             errors.publisher = "Campaign not allocated";
             return res.status(400).json(errors);
           } else {
             success = "Campaign allocation done successfully";
           }
         });
 
         // Insert In Campaign Log table...
         var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + req.body.campID + "','" + user.id + "','" + result[i].pID + "','" + status + "','" + description + "','" + req.body.user.userID + "','" + req.body.user.firstName + "','" + req.body.user.lastName + "','" + formatted + "')";
         pool.query(sql1, function (err, results, fields) {
           if (err) {
             log.error("Error inside reassignCampaign 1==>" + err);
 
           }
         });
       } catch (err) {
         errors.publisher = "Campaign not allocated";
         return res.status(400).json(errors);
       }
       //Copy Allovated Detail to one array to other array For email functionality
       campaignDetail.push(Object.assign({}, result[i]));
       // //
     }
 
   }//End Of For loop
 
   //Update The status for multiple publisher in  as Reassign in publisher_allocation Table
   pool.query("select distinct(pID), status from publisher_allocation where campID='" + campID + "' and status='Reject' ", function (error, results, fields) {
     if (error) throw error;
     var l = results.length;
     for (var i = 0; i < l; i++) {
       if (results[i].status == 'Reject') {
         pool.query("delete from publisher_allocation WHERE campID ='" + campID + "' and pID ='" + results[i].pID + "' and status='" + reject + "'",
           function (error, results, fields) {
             if (error) {
               errors.publisher = "Campaign Not Reassign";
               return res.status(400).json(errors);
             }
             //res.send(JSON.stringify(results));
           });
       }
     }
   });
 
   var statusList = ['ReAssign', 'Cancel'];
   setTimeout(function () {
     var sql = "select sum(allocatedLead) as allocatedLeads from publisher_allocation where campID ='" +
       campID + "' and status NOT IN(?)";
     pool.query(sql, [statusList], function (error, results, fields) {
       if (error) throw error;
       pubAllocatedLead = results[0].allocatedLeads;
       if (leadAllocationCamp > pubAllocatedLead) {
         var updateStat = "UPDATE campaign SET status ='" + stat1 + "',lastUpdated ='" + formatted + "' WHERE campID ='" + campID + "'"
       } else {
         var updateStat = "UPDATE campaign SET status ='" + stat2 + "',lastUpdated ='" + formatted + "' WHERE campID ='" + campID + "'"
       }
       pool.query(updateStat,
         function (error, results, fields) {
           if (error) {
             errors.publisher = "Campaign Not Allocated";
             return res.status(400).json(errors);
           }
         });
     });
   }, 1000);
   /*Email Sending */
   var user_role = "PC";
   var user_role1 = "AC";
   for (var s = 0; s < campaignDetail.length; s++) {
     let count = s;
     //get all agency details from user_details table
     var queryTemp = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' AND ud.orgID='" + campaignDetail[s].pID + "'and ec.campaignAllocation='" + emailConfigYes + "') OR (ud.role='" + user_role1 + "' and ud.orgID='" + user.id + "' and ec.campaignAllocation='" + emailConfigYes + "') ";
     pool.query(queryTemp, function (err, results, fields) {
       if (err) {
         log.error("Error=" + err);
         errors.publisher = "Campaign not allocated";
         return res.status(400).json(errors);
       } else {
         email.emailAllocated(user, campID, results, campaignDetail[count].pID, campaignDetail[count].startDate, campaignDetail[count].endDate, campaignDetail[count].allocatedLead, campaignDetail[count].cpl);
         success = "Campaign allocation done successfully";
       }
     });
     success = "Campaign allocation done successfully";
   }
 
   // res.send(JSON.stringify(sucess));
   success = "Campaign allocation done successfully";
   res.json({ success: true, message: success });
   //
 });
 
 
 /*@author somnath keswad
  * Desc select the Un Rejected publisher from publisher table
  @version 1.0
  */
 
 router.get("/unRejectedPublisher", function (req, res, next) {
   log.info("In unRejectedPublisher");
   var campID = url.parse(req.url, true).query.campID;
   var errors;
   var reject = properties.get('pubStatus.rejectCampaign');
   var approve = properties.get('pubStatus.approve');
   //  res.locals.connection.query("select distinct(pID), status from publisher_allocation where campID='" + campID + "' and status='" +reject+"'  ", function ( error,results1,fields) {
   //   if (error) {
   //     return res.status(400).json(errors);
   //     }
   //     else{
   //   var rejectedpID = [];
   //      var l = results1.length;
   //   for (var i = 0; i < l; i++) {
   //     rejectedpID.push(results1[i].pID);
   //   }
   //added firstLeadDeliveryDate in query-Sonali
   pool.query("select p.pID,p.publisherName,p.rating, c.startDate,c.endDate,c.CPL as campCPL,pa.CPL as cpl,c.firstLeadDeliveryDate,p.gdprCompliance from campaign c join publisher p join user_mapping um on um.pID=p.pID and um.agencyID=c.agencyID left JOIN publisher_allocation pa on (pa.pID=p.pID and pa.campID=c.campID) where c.campID='" + campID + "' and um.agencyStatus='" + approve + "' and um.publisherStatus='" + approve + "' order by p.rating asc limit 10 ", function (error, results, fields) {
     if (error) {
       log.error("Error inside unRejectedPublisher==>" + error);
       return res.status(400).json(errors);
     } else {
 
       res.send(JSON.stringify(results));
       //
     }
   });////
   //  }
 
   // }); //
 });
 /*@author somnath keswad
  * Desc display the data on tooltip in Allocated Campaign Tab in Agency View
  
  */
 router.get("/toolTipData", function (req, res, next) {
   log.info("inside toolTipData");
   //var campID = url.parse(req.url, true).query.campID;
   var errors;
   var status = "Reject";
   var sql = "select pa.allocationID, pa.pID, pa.campID,p.publisherName,c.currency, sum(pa.allocatedLead) as rejectedLead,pa.allocatedLead,pa.status, pa.CPL, pa.reasonOfRejection,sum(pa.counterLead) as counterLead,pa.counterCPL,c.budget,c.currency from publisher_allocation pa join publisher p on pa.pID = p.pID join campaign c on c.campID=pa.campID  where  pa.status = 'Reject' or pa.status = 'Counter' group by pa.allocationID,pa.pID";
   pool.query(sql,
     function (error, results, fields) {
       if (error) {
         log.error("Error inside toolTipData==>" + error);
         return res.status(400).json(errors);
       } else {
         res.send(JSON.stringify(results));
         //
       }
     }
   );
   // //
 }
 );
 
 
 /*@author somnath keswad
  * Desc select the publisher from publisher table to show in Counter Allocate
  @version 1.0
  */
 router.get("/showPubInCounterAllocate", function (req, res, next) {
   log.info("inside showPubInCounterAllocate");
   var campID = url.parse(req.url, true).query.campID;
 
   var counter = properties.get('pubStatus.counterCampaign');
   var approve = properties.get('pubStatus.approve');
   // res.locals.connection.query("select distinct(pID), status from publisher_allocation where campID='" + campID + "' and status='" +counter+"' ", function (
   //   error,
   //   results1,
   //   fields
   // ) {
   //   if (error) throw error;
   //   var rejectedpID = [];
 
   //   var l = results1.length;
   //   for (var i = 0; i < l; i++) {
   //     rejectedpID.push(results1[i].pID);
   //   }
   //added firstLeadDeliveryDate in query-Sonali
   pool.query("select p.pID,p.publisherName,p.rating, c.startDate,c.endDate,c.CPL as campCPL,pa.CPL as cpl,c.firstLeadDeliveryDate,p.gdprCompliance from campaign c join publisher p join user_mapping um on um.pID=p.pID and um.agencyID=c.agencyID left JOIN publisher_allocation pa on (pa.pID=p.pID and pa.campID=c.campID) where c.campID='" + campID + "' and um.agencyStatus='" + approve + "' and um.publisherStatus='" + approve + "' group by p.pID order by p.rating asc limit 10", function (
     error,
     results,
     fields
   ) {
     if (error) {
       log.error("Error inside showPubInCounterAllocate==>" + error);
       throw error;
     }
 
 
     res.send(JSON.stringify(results));
     //
   });// //
 
   //}); ////
 });
 
 
 
 /*@author somnath keswad
  * Desc select the specific campaign which he click on Counter Allocate
  @version 1.0
  */
 router.get("/allocatingCounterCampID", function (req, res, next) {
   log.info("inside allocatingCounterCampID");
   var campID = url.parse(req.url, true).query.campID;
   var status = "Assign";
   var status1 = "Accept";
   //added firstLeadDeliveryDate in query-Sonali
   pool.query("select c.campID,c.campaignName,c.ABM,c.clientCampID,c.region,c.country,c.startDate,c.endDate,c.CPL,c.firstLeadDeliveryDate,c.timezone,c.budget,c.currency,pa.pID,pa.counterLead,pa.counterCPL,\
     (select sum(pa.allocatedLead)  from publisher_allocation pa where pa.status='Reject' and pa.campID='"+ campID + "')as rejectedLead,(select sum(pa.counterLead)as counterLead from publisher_allocation pa where pa.status='Counter' and pa.campID='" + campID + "' group by pa.campID)as counterLead,\
     c.leadAllocation,sum(pa.allocatedLead) as allocatedLead,pa.status,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead,sum(pa.allocatedLead*pa.cpl) as allocatedBudget ,(c.budget-sum(pa.allocatedLead*pa.cpl))as remainingBudget from campaign c left join publisher_allocation pa on c.campID = pa.campID \
     WHERE (c.campID ='"+ campID + "' and pa.status='" + status + "') or(c.campID ='" + campID + "' and pa.status='" + status1 + "')or(c.campID ='" + campID + "' and pa.status='Counter')or(c.campID ='" + campID + "' and pa.status='AcceptedCounter')",
 
     [campID],
 
     function (error, results, fields) {
       if (error) {
         log.error("Error inside allocatingCounterCampID==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //
     }
   );// //
 });
 
 
 
 /*@author somnath keswad
 * Desc Counter Allocate Campaign
 Date:14/03/2019
 */
 router.post("/counterAllocate", function (req, res, next) {
   log.info("inside counterAllocate");
   var counterLeads = req.body.counterDetails[0].counterLead;
   var pendingLeads = req.body.counterDetails[0].pendingLead;
   var success;
   var errors;
   var user = req.body.user;
   let campaignDetail = [];
   var reAssign = properties.get('agencyStatus.reAssign');
   var counter = properties.get('pubStatus.counterCampaign');
   var progressStatus = properties.get('agencyStatus.partialAllocation');
   var assign = properties.get('agencyStatus.newAllocation');
   var campID = req.body.campID;
   var counterpID = req.body.counterpID;
   var clientCampID = req.body.clientCampID;
   // var leadAllocation = req.body.leadAllocation;
   // var la = parseInt(leadAllocation);
   var description=campaignTraceProperties.get('campaign.allocation.counter');//Sonali-3257-get details from properties file
 
   var user_ID = req.body.user.id;
   var firstName = req.body.user.firstName;
   var lastName = req.body.user.lastName;
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
   const result = Array.from(new Set(newDynamicArray.map(p => p.pID))).map(pID => {
     return {
       pID: pID,
       publisherName: newDynamicArray.find(p => p.pID === pID).publisherName,
       startDate: newDynamicArray.find(p => p.pID === pID).startDate,
       endDate: newDynamicArray.find(p => p.pID === pID).endDate,
       allocatedLead: newDynamicArray.find(p => p.pID === pID).allocatedLead,
       cpl: newDynamicArray.find(p => p.pID === pID).cpl != null ? newDynamicArray.find(p => p.pID === pID).cpl : newDynamicArray.find(p => p.pID === pID).campCPL,
       firstLeadDeliveryDate: newDynamicArray.find(p => p.pID === pID).firstLeadDeliveryDate
 
     };
   });
 
 
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
 
   for (var i = 0, l = result.length; i < l; i++) {
     if (result[i].allocatedLead == undefined || result[i].allocatedLead == '') {
     }
     else {
       try {
         pool.query("insert into publisher_allocation (pID,campID,startDate,endDate,firstLeadDeliveryDate,allocatedLead,CPL,created,lastUpdated,status) values('" + result[i].pID + "','" + req.body.campID + "','" + result[i].startDate + "','" + result[i].endDate + "','" + result[i].firstLeadDeliveryDate + "','" + result[i].allocatedLead + "','" + parseFloat(result[i].cpl).toFixed(2) + "','" + formatted + "','" +
           formatted + "','" + assign + "')", function (err, results, fields) {
             if (err) {
               log.error("Error inside CounterAllocation==>" + err);
               errors.publisher = "Campaign not allocated";
               return res.status(400).json(errors);
             } else {
               success = "Campaign allocation done successfully";
             }
           });
         var query = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + result[i].pID + "','" + assign + "','" + description + "','" + user.userID + "','" + firstName + "','" + lastName + "','" + formatted + "')";
         pool.query(query, function (error, results, fields) {
           if (error) {
             log.error("Error inside CounterAllocation 1==>" + error);
 
             throw error;
           }
         });
       } catch (err) {
         errors.publisher = "Campaign not allocated";
         return res.status(400).json(errors);
       }
       //Copy Allovated Detail to one array to other array For email functionality
       campaignDetail.push(Object.assign({}, result[i]));
       // //pool.end();
     }
   }//End Of For loop
 
   //delete record of Counter publisher from publisher_allocation Table
   setTimeout(function () {
     pool.query("delete from  publisher_allocation  WHERE campID ='" + campID + "' and pID ='" + counterpID + "'and status='" + counter + "'", function (error, results, fields) {
       if (error) {
         errors.publisher = "Campaign Not Reassign";
         return res.status(400).json(errors);
       }
     });
   }, 1000);
   var counterlead = parseInt(counterLeads);
   var pendingLead = parseInt(pendingLeads)
 
   if (pendingLead > counterlead) {
     pool.query("UPDATE campaign SET status ='" + progressStatus + "',lastUpdated ='" + formatted + "' WHERE campID ='" + campID + "'",
       function (error, results, fields) {
         if (error) {
           errors.publisher = "Campaign Not Allocated";
           return res.status(400).json(errors);
         }
       });
   }
 
   /**
 * @author Narendra Phadke
 * @param  Description handle the Email Functionality 
 * @return Description return successfully allocate message
 */
   var user_role = "PC";
   var user_role1 = "AC";
 
   for (var s = 0; s < campaignDetail.length; s++) {
 
     let count = s;
     //get all agency details from user_details table
     var queryTemp = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' AND ud.orgID='" + campaignDetail[s].pID + "'  and ec.campaignAllocation='" + emailConfigYes + "') OR (ud.role='" + user_role1 + "'and ud.orgID='" + user.id + "'  and ec.campaignAllocation='" + emailConfigYes + "')";
     pool.query(queryTemp, function (err, results, fields) {
       if (err) {
         errors.publisher = "Campaign not allocated";
         return res.status(400).json(errors);
       } else {
 
         email.emailAllocated(user, campID, results, campaignDetail[count].pID, campaignDetail[count].startDate, campaignDetail[count].endDate, campaignDetail[count].allocatedLead, campaignDetail[count].cpl);
         success = "Campaign allocation done successfully";
       }
     });
     success = "Campaign allocation done successfully";
   }
   success = "Campaign allocation done successfully";
   res.json({ success: true, message: success });
   //pool.end();
 });
 
 
 
 /*@author Supriya Gore
  * Desc getting the Count OF pending campaign
  @version 1.0
  */
 router.get("/pubPendingCampaignCount", function (req, res, next) {
   log.info("inside pubPendingCampaignCount");
   var pID = url.parse(req.url, true).query.pID;
   var pending = properties.get('pubStatus.pendingCampaign');
 
   var sql = "SELECT count(pa.campID)as pubPendingCount  FROM publisher_allocation pa join campaign c on pa.campID=c.campID  join user_mapping um on um.pID=pa.pID and c.agencyID=um.agencyID where pa.status='" + pending + "' and pa.pID='" + pID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside pubPendingCampaignCount==>" + error);
       throw error;
     }
     res.send(JSON.stringify(results));
     //pool.end();
   }
   );// //pool.end();
 });
 
 /*@author somnath keswad
  * Desc getting the Count OF Assign and Counter Campaign
  @version 1.0
  */
 router.get("/pubNewCount", function (req, res, next) {
   log.info("inside pubNewCount");
   var pID = url.parse(req.url, true).query.pID;
   var assign = properties.get('agencyStatus.newAllocation');
   var counter = properties.get('pubStatus.counterCampaign');
   var acceptedCounter = properties.get('agencyStatus.acceptCounter');
   var sql = "SELECT count(pa.campID)as pubAssignCount  FROM publisher_allocation pa join campaign c on pa.campID=c.campID  join user_mapping um on um.pID=pa.pID and c.agencyID=um.agencyID where (pa.status='" + assign + "' and pa.pID='" + pID + "') or (pa.status='" + acceptedCounter + "' and pa.pID='" + pID + "');SELECT count(pa.campID)as pubCounterCount FROM publisher_allocation pa join campaign c on pa.campID=c.campID join user_mapping um on um.pID=pa.pID and c.agencyID=um.agencyID where pa.status='" + counter + "' and pa.pID='" + pID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside pubNewCount==>" + error);
       throw error;
     }
     res.send(JSON.stringify(results));
     //pool.end();
   }
   ); ////pool.end();
 });
 
 
 // router.get("/sumAcceptStatusLeads", function (req, res, next) {
 //   var pID = url.parse(req.url, true).query.pID;
 //   var errors;
 
 //   var status1 = "Accept";
 //   // var status = "Assign";
 //   var sql = "select allocationID,campID,sum(allocatedLead)as allocatedLead from  publisher_allocation where  status='"+status1+"' group by campID order by campID DESC";
 //   pool.query(sql,
 //     function (error, results, fields) {
 //       if (error) {
 //         return res.status(400).json(errors);
 //       }else{      
 //       res.send(JSON.stringify(results));
 //     }
 //     }
 //   );
 //   //pool.end();
 // }
 // );
 
 /*@author somnath keswad
  * Desc Accept the campaign and Counter CPL to the selected publisher by agency
  update the status is Assign not Accept
  
  */
 router.post("/acceptCounterCampaign", function (req, res, next) {
   log.info("inside acceptCounterCampaign");
   var pID = req.body.pID;
   var user = req.body.user;
   var allocationID = req.body.allocationID;
   var campID = req.body.campaignDetail[0].campID;
   var clientCampID = req.body.campaignDetail[0].clientCampID;
   var allocatedLead = req.body.campaignDetail[0].allocatedLead;
   var allocatingInProgress = properties.get('agencyStatus.partialAllocation');
   var finalBudget = req.body.finalBudget;
   var campStatus = 'AllocatingInProgress';
   if (clientCampID == undefined || clientCampID == '' || clientCampID == null) {
     clientCampID = '';
   }
   var counterLead = req.body.counterLead;
   var counterCPL = req.body.counterCPL;
   counterCPL = counterCPL.toFixed(2);
   var userName = req.body.user;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var user_ID = req.body.user.id;
   var firstName = req.body.user.firstName;
   var lastName = req.body.user.lastName;
   var campaignDetail = req.body.campaignDetail;
   //let data;
   var status = "AcceptedCounter";
   var description=campaignTraceProperties.get('campaign.agency.accept');//Sonali-3257-get details from properties file
 
   var success;
   var errors;
   var user_role = "PC";
 
   //get all agency details from user_details table
 
   try {
     var query = "UPDATE publisher_allocation SET allocatedLead='" + counterLead + "',CPL='" + counterCPL + "',status ='" + status + "',lastUpdated='" + formatted + "' WHERE allocationID='" + allocationID + "'";
     pool.query(query, function (error, results, fields) {
       if (error) {
         log.error("Error inside acceptCounterCampaign==>" + error);
         errors.publisher = "Campaign Not Accepted";
         return res.status(400).json(errors);
 
       } else {
 
         var updateCampaign = "update campaign set budget='" + finalBudget + "' where campID='" + campID + "'";
         pool.query(updateCampaign, function (error, result, fields) {
           if (error) {
             log.erro("error inside publisher/acceptCountr===>" + err);
           }
           else {
           }
         });
         // Email Sending
         pool.query("select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "'and ud.orgID='" + pID + "' and ec.counterAcceptCampaign='" + emailConfigYes + "') OR (ud.role='AC'and ud.orgID='" + user.id + "' and ec.counterAcceptCampaign='" + emailConfigYes + "')", function (error, result, fields) {
           if (error) throw error;
           else {
             if (result.length > 0) {
               email.counterAcceptEmailSend(user, result, campaignDetail, counterLead);
             }
           }
         });
         // Update status in campaign table if praposed leads is less than Old lead
 
         var allocatedLeads = parseInt(allocatedLead);
         var counterLeads = parseInt(counterLead);
         if (counterLeads < allocatedLeads) {
           var query1 = "update campaign set status='" + allocatingInProgress + "',lastUpdated='" + formatted + "' where campID='" + campID + "'";
           pool.query(query1, function (error, results2, fields) {
             if (error) throw error;
             success = 'Campaign accepted successfully.';
             res.json({ success: true, message: success });
             //pool.end();
           });
 
         } else {
           success = "Counter proposal accepted successfully for this campaign.";
           res.json({ success: true, message: success });
         }
       }
     });
     var querylog = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','" + status + "','" + description + "','" + user.userID + "','" + firstName + "','" + lastName + "','" + formatted + "')";
     pool.query(querylog, function (error, result, fields) {
       if (error) throw error;
     });
   } catch (error) {
     errors.publisher = "Campaign Not Accepted";
     return res.status(400).json(errors);
   }
   success = 'Campaign accepted successfully.';
   // res.json({ success: true, message: success });
 
 });
 
 
 /*@author somnath keswad
  * Desc Reject the campaign and CPL to the by the Agency
  
  Date:11/03/2019
  */
 router.post("/rejectCounterCampaign", function (req, res, next) {
   log.info("inside rejectCounterCampaign");
   var allocationID = req.body.allocationID;
   var campID = req.body.campaignDetail[0].campID;
   var campStatus = 'AllocatingInProgress';
   var pID = req.body.pID;
   var reason = req.body.reason;
   if (reason == undefined || reason == '' || reason == null) {
     reason = '';
   }
   // var userName = req.body.user;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var status = "RejectedCounter";
   var description=campaignTraceProperties.get('campaign.agency.reject');//Sonali-3257-get details from properties file
   var clientCampID = req.body.campaignDetail[0].clientCampID;
   var user_ID = req.body.user.id;
   var firstName = req.body.user.firstName;
   var lastName = req.body.user.lastName;
   var user = req.body.user;
   var campaignDetail = req.body.campaignDetail;
 
   var success;
   var errors;
   var user_role = "PC";
 
   try {
     var query = "UPDATE publisher_allocation SET status ='" + status + "',reasonOfRejection ='" + escape(reason) + "',lastUpdated='" + formatted + "' WHERE allocationID ='" + allocationID + "';update campaign set status='" + campStatus + "',lastUpdated ='" + formatted + "' where campID='" + campID + "'";
     pool.query(query, function (error, results, fields) {
       if (error) {
         log.error("Error inside rejectCounterCampaign==>" + error);
         errors.publisher = "Campaign Not Rejected";
         return res.status(400).json(errors);
       } else {
         success = "Campaign Rejected successfully";
       }
     });
     //get all agency details from user_details table
     pool.query("select ud.userID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "'and ud.orgID='" + pID + "' and ec.counterRejectCampaign='" + emailConfigYes + "') OR (ud.role='AC'and ud.orgID='" + user.id + "' and ec.counterRejectCampaign='" + emailConfigYes + "')", function (error, result, fields) {
       if (error) throw error;
       if (result.length > 0)
         email.counterRejectEmail(user, result, campaignDetail, reason);
     });
     var sql = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + req.body.campaignDetail[0].campID + "','" + user.id + "','" + pID + "','" + status + "','" + description + "','" + user.userID + "','" + firstName + "','" + lastName + "','" + formatted + "')";
     pool.query(sql, function (error, results, fields) {
       if (error) {
         log.error("Error inside rejectCounterCampaign==>" + error);
       }
     });
 
   } catch (error) {
     errors.publisher = "Campaign Not Rejected";
     return res.status(400).json(errors);
   }
   success = 'Campaign rejected successfully';
   res.json({ success: true, message: success });
 
   //pool.end();
 });
 
 
 /**
  * @author Sanobar Golandaj
  * @param  Description Fetch the Campaign Details from database 
  * @return Description return successfully send response to react page
  */
 router.get("/reviewlead", function (req, res, next) {
   log.info("inside reviewlead");
   //var campID = req.body.campID;
   var campID = url.parse(req.url, true).query.campID;
   pool.query("select clientCampID,campID,parentCampID,reallocationID,publisherCampID,campaignName,clientName,jobTitle,jobLevel,jobFunction,industry,customIndustry,campaignStatus,region,country,state,stateFileName,city,cityFileName,zipCode,zipCodeFileName,startDate,endDate,firstLeadDeliveryDate,timezone,leadAllocation,ABM,campaignReportingDay,leadDeliveryOption,pacing,pacingLeadAllocation,insertionOrder,marketingChannel,otherSpecs,noOfLeadPerDomain,createdByCompanyName,leadDeliveryFormat,status,budget,CPL,currency,employeeSize,customEmpSize,industryFileName,advertiserID,agencyID,companyRevenue,customCompRevenue,customJobFunction,lpTimeline,requiredLPApproval,callAudit from campaign  WHERE  campID='" + campID + "' ",
     [campID],
     // "select * from campaign WHERE campID ='" + campID + "'",
     function (error, results, fields) {
       if (error) throw error;
 
       res.send(JSON.stringify(results));
       //pool.end();
     }
   );
   // //
 });
 
 /**
  * @author Somnath Keswad
  * @param  Description Upload POC file on Server
  * @return Description return message successfully Upload file
  */
 router.post("/uploadPOCFILE", function (req, res, next) {
   log.info("inside uploadPOCFILE");
   var campID = req.body.campID;
   var file = req.files.file;
   var pID = req.body.pID;
   var supportDocID = req.body.supportDocID;
   //var status='AgencyReviewPending';
   var status = 'waitingForSubmit'
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var filename = file.name;
   var feedback = "";
   var fileContents = file.data;
   var fileContents1 = Buffer.from(fileContents, "base64");
   var sql = "select supportDocID,pID,status from poc_details where supportDocID='" + supportDocID + "' and pID='" + pID + "' and campID='" + campID + "'";
   pool.query(sql, function (error, pocResult, fields) {
     if (error) {
       log.error("Error inside uploadPOCFILE==>" + error);
       return res.status(400).json(errors);
     }
     else {
       if (pocResult.length > 0) {
 
         query = "update poc_details SET ? where campID='" + campID + "' and supportDocID='" + supportDocID + "' and pID='" + pID + "'",
           values = {
             pocFileName: file.name,
             pocDocument: fileContents1,
             status: status,
             lastUpdated: formatted
           };
         pool.query(query, values, function (error, results, fields) {
           if (error) {
             log.error("Error In POC Upload" + error);
 
             res.send(404);
           } else {
             res.send(JSON.stringify(results));
           }
         });
 
       } else {
         query = "insert into poc_details SET ?",
           values = {
             campID: campID,
             pID: pID,
             supportDocID: supportDocID,
             pocFileName: file.name,
             pocDocument: fileContents1,
             status: status,
             feedback: feedback,
             created: formatted,
             lastUpdated: formatted
           };
         pool.query(query, values, function (error, results, fields) {
           if (error) {
             log.error("Error In POC Upload" + error);
 
             res.send(404);
           } else {
             res.send(JSON.stringify(results));
           }
         });
       }
 
     }
   });
 });
 
 
 /**
  * @author Supriya Gore
  * @param  Description Upload CS file on Server
  * @return Description return message successfully Upload file
  */
 router.post("/uploadCSFILE", function (req, res, next) {
   log.info("inside uploadCSFILE");
   var campID = req.body.campID;
   var file = req.files.file;
   var pID = req.body.pID;
   var supportDocID = req.body.supportDocID;
   //var status='AgencyReviewPending';
   var status = 'waitingForSubmit'
 
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var filename = file.name;
   var feedback = "";
   var fileContents = file.data;
   var fileContents1 = Buffer.from(fileContents, "base64");
   var sql = "select supportDocID,pID,status from call_script_details where supportDocID='" + supportDocID + "' and pID='" + pID + "' and campID='" + campID + "'";
   pool.query(sql, function (error, csResult, fields) {
     if (error) {
 
       log.error("Error inside uploadCSFILE==>" + error);
       return res.status(400).json(errors);
     }
     else {
       if (csResult.length > 0) {
         query = "update call_script_details SET ? where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'",
           values = {
             csFileName: file.name,
             csDocument: fileContents1,
             status: status,
             lastUpdated: formatted
           };
         pool.query(query, values, function (error, results, fields) {
           if (error) {
             log.error("Error In POC Upload" + error);
 
             res.send(404);
           } else {
             res.send(JSON.stringify(results));
             //pool.end();
           }
         });
       } else {
         query = "insert into call_script_details SET ?",
           values = {
             campID: campID,
             pID: pID,
             supportDocID: supportDocID,
             csFileName: file.name,
             csDocument: fileContents1,
             status: status,
             feedback: feedback,
             created: formatted,
             lastUpdated: formatted
           };
         pool.query(query, values, function (error, results, fields) {
           if (error) {
             log.error("Error In POC Upload" + error);
 
             res.send(404);
           } else {
             res.send(JSON.stringify(results));
             //pool.end();
           }
         });
       }
     }
   });
 });
 
 /**
  * @author Somnath Keswad
  * @param  Description show the POC data in popup to upload POC
  * @return Description 
  */
 
 router.post("/POCSubmissionPopUP", function (req, res, next) {
   log.info("inside POCSubmissionPopUP");
   //var status = "pendingSubmission";
   var campID = req.body.campID;
   var errors;
   var pID = req.body.pID;//publisher ID HardCoaded because its given from publisher login
 
   const result1 = [];
   //var connection1 = pool;
 
   pool.query("SELECT * from poc_details where campID='" + campID + "' AND pID='" + pID + "'",
     function (error, results, fields) {
       if (error) {
         log.error("Error inside POCSubmissionPopUP==>" + error);
         throw error;
       }
 
       for (var i = 0, l = results.length; i < l; i++) {
         result1.push(results[i]);
       }
 
       if (results.length > 0) {
         var listSupportDocID = [];
         var Asset = "Asset";
         var query2 = "select pd.campID,pd.pID,pd.supportDocID,pd.status,pd.feedback,pd.pocFileName,sd.suppDocName,c.clientCampID,c.agencyID from poc_details pd join supporting_document sd on sd.campID=pd.campID and sd.supportDocID=pd.supportDocID join campaign c on pd.campID=c.campID  where pd.campID='" + campID + "' AND pd.pID='" + pID + "' order by pd.supportDocID asc"
         pool.query(query2, function (error, results1, fields) {
           if (error) {
             log.error("Error inside POCSubmissionPopUP 1==>" + error);
 
             return res.status(400).json(errors);
           } else {
 
             for (var i = 0; i < results1.length; i++) {
               listSupportDocID.push(results1[i].supportDocID);
             }
             var query3 = "select sd.campID,sd.supportDocID,sd.suppDocName,c.clientCampID,c.agencyID from supporting_document sd join campaign c on sd.campID=c.campID where sd.campID='" + campID + "' and sd.typeOfSuppDoc='" + Asset + "' and sd.supportDocID NOT IN(?) order by sd.supportDocID asc";
             pool.query(query3, [listSupportDocID], function (error, results, fields) {
               if (error) {
                 log.error("Error inside POCSubmissionPopUP 3==>" + error);
 
                 return res.status(400).json(errors);
               }
               else {
                 for (var i = 0; i < results1.length; i++) {
                   results.push(results1[i]);
                 }
                 res.send(JSON.stringify(results));
                 //pool.end();
               }
             });////pool.end();
           }
         }
         );
 
       } else {
         var Asset = "Asset";
         pool.query(
           "SELECT sd.campID,pa.pID, sd.supportDocID,sd.suppDocName,c.clientCampID,c.agencyID from supporting_document sd join publisher_allocation pa on pa.campID = sd.campID  join campaign c on sd.campID=c.campID  where pa.pID='" + pID + "' and sd.campID=? AND sd.typeOfSuppDoc='" + Asset + "'group by sd.supportDocID",
           [campID],
           function (error, results, fields) {
             if (error) throw error;
             res.send(JSON.stringify(results));
             //pool.end();
           }
         );
         ////pool.end();
       }
 
     }
   );
 });
 
 /**
  * @author Somnath Keswad
  * @param  Description Submit The POC file Information with Assetwise and email
  * @return Description return message successfully to submit POC 
  */
 router.post("/submitPOCRecord", function (req, res, next) {
   log.info("In Publisher/submitPOCRecord");
   const { user, pID, parentCampID, reallocationID, agencyID } = req.body;
   let agencyReviewPending = properties.get("agencyStatus.agencyReviewPending")
   var description=campaignTraceProperties.get('campaign.submit.poc');//Sonali-3257-get details from properties file
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
   const result = Array.from(new Set(newDynamicArray.map(sd => sd.supportDocID))).map(
     supportDocID => {
       return {
         supportDocID: supportDocID,
         campID: newDynamicArray.find(sd => sd.supportDocID === supportDocID).campID,
         suppDocName: newDynamicArray.find(sd => sd.supportDocID === supportDocID).suppDocName,
         pocFileName: newDynamicArray.find(sd => sd.supportDocID === supportDocID).pocFileName
       };
     });
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
 
   var lpSubDetails = [];
   const len = result.length;
   for (let i = 0; i < len; i++) {
     if (result[i].pocFileName != undefined) {
       lpSubDetails.push(result[i]);
       var campID = result[0].campID;
       var query = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + result[i].campID + "','" + agencyID + "','" + pID + "','" + result[i].supportDocID + "','" + agencyReviewPending + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
       pool.query(query, function (error, results, fields) {
         if (error) {
           log.error("Error Publisher/submitPOCRecord" + error);
           return res.status(400).json(error);
         }
       });
     }
   }//End of Loop
   var userID = user.id;
   var user_role = "AC";
   var user_role1 = "PC";
   var user_role2 = "ANC";
   let sql = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' and ud.orgID='" + agencyID + "' and ec.pocSubmit='" + emailConfigYes + "' ) OR (ud.role='" + user_role1 + "' and ud.orgID='" + userID + "'  and ec.pocSubmit='" + emailConfigYes + "') OR (ud.role='" + user_role2 + "' and ud.orgID='" + agencyID + "'  and ec.pocSubmit='" + emailConfigYes + "')";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error Publisher/submitPOCRecord" + error);
       return res.status(400).json(error);
     } else {
       if (results.length > 0) {
         email.pocSubmission(user, campID, pID, results, lpSubDetails, parentCampID, reallocationID, agencyID);
       }
     }
   });
   var success = 'POC Uploaded successfully.Please close the window';
   res.json({ success: true, message: success });
 });//End of submitPOCRecord
 
 /**
 * @author Supriya Gore
 * @param  Description Submit The CS file Information with Assetwise and email
 * @return Description return message successfully to submit CS 
 */
 router.post("/submitCSRecord", function (req, res, next) {
   log.info("inside submitCSRecord");
   let data = req.body;
   // var data=req.body.data;
   var success;
   var error;
   var agencyID = req.body.agencyID;
   var clientCampID = req.body.clientCampID;
   var pID = req.body.pID;
   var parentCampID = req.body.parentCampID;
   var reallocationID = req.body.reallocationID;
   var description=campaignTraceProperties.get('campaign.submit.cs');//Sonali-3257-get details from properties file
   var status = 'AgencyReviewPending';
   var user = req.body.user;
 
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
 
   const result = Array.from(new Set(newDynamicArray.map(sd => sd.supportDocID))).map(
     supportDocID => {
       return {
         //pID: pID,
         supportDocID: supportDocID,
         campID: newDynamicArray.find(sd => sd.supportDocID === supportDocID).campID,
         suppDocName: newDynamicArray.find(sd => sd.supportDocID === supportDocID).suppDocName,
         csFileName: newDynamicArray.find(sd => sd.supportDocID === supportDocID).csFileName
         // pID: newDynamicArray.find(sd => sd.supportDocID === supportDocID).pID,
       };
     }
   );
   var status;
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
 
   var feedback = "";
   var lpSubDetails = [];
   for (var i = 0; i < result.length; i++) {
     if (result[i].csFileName != undefined) {
       lpSubDetails.push(result[i]);
       var campID = result[0].campID;
       var query = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + result[i].campID + "','" + agencyID + "','" + pID + "','" + result[i].supportDocID + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
       pool.query(query,
         function (error, results, fields) {
           if (error) {
             log.error("Error In Insert Records :" + error);
             throw error;
           }
           else {
 
 
 
           }
         });
 
     }
   }
   var userID = user.id;
   var user_role = "AC";
   var user_role1 = "PC";
   var user_role2 = "ANC";
   // var EmailContentOfLP=[];
   var agencyDetails = [];
   // var countlp;
   var query = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role + "' and ud.orgID='" + agencyID + "' and ec.csSubmit='" + emailConfigYes + "') OR (ud.role='" + user_role1 + "' and ud.orgID='" + userID + "' and ec.csSubmit='" + emailConfigYes + "') OR (ud.role='" + user_role2 + "' and ud.orgID='" + agencyID + "' and ec.csSubmit='" + emailConfigYes + "') ";
   //get all agency details from user_details table
   pool.query(query,
     function (error, results, fields) {
       if (error) {
         log.error("Error inside submitCSRecord==>" + error);
         throw error;
       }
       //push Result into agency detils
 
       // agencyDetails.push(results);
       if (results.length > 0) {
         email.csSubmission(user, campID, pID, results, lpSubDetails, parentCampID, reallocationID, agencyID);
       }
       success = 'CS Uploaded successfully.Please close the window';
       res.json({ success: true, message: success });
       //pool.end();
     }
   );
 
 });
 /**
  * @author Somnath Keswad
  * @param  Description Delete the uploaded POC file from Server
  * 
  */
 
 router.post("/pocDelete", function (req, res, next) {
   log.info("inside pocDelete");
   var campID = req.body.campID;
   var pID = req.body.pID;
   var supportDocID = req.body.supportDocID;
   var errors;
   var status = 'PendingSubmission';
   sql1 = "delete from poc_details where campID='" + campID + "' and supportDocID='" + supportDocID + "' and pID='" + pID + "'"
   pool.query(sql1, function (error, results, fields) {
     if (error) {
       log.error("Error In Delete POC :" + error);
 
       return res.status(400).json(errors);
     }
     else {
       results['supportDocID'] = supportDocID;
       res.send(JSON.stringify(results));
       //pool.end();
     }
   });
   // //pool.end();
 });
 
 /**
 * @author Supriya Gore
 * @param  Description Delete the uploaded CS file from Server
 * 
 */
 
 router.post("/csDelete", function (req, res, next) {
   log.info("inside csDelete");
   var campID = req.body.campID;
   var pID = req.body.pID;
   var supportDocID = req.body.supportDocID;
   var errors;
   var status = 'PendingSubmission';
   sql1 = "delete from call_script_details where campID='" + campID + "' and supportDocID='" + supportDocID + "' and pID='" + pID + "'"
   pool.query(sql1, function (error, results, fields) {
     if (error) {
       log.error("Error inside csDelete==>" + error);
       return res.status(400).json(errors);
     }
     else {
       results['supportDocID'] = supportDocID;
       res.send(JSON.stringify(results));
       //pool.end();
     }
   });
   ////pool.end();
 });
 
 /*@author Somnath Keswad
  * Desc In Get Completed Campaign in Archive Tab
  
  */
 router.get("/publisherArchiveCampList", function (req, res, next) {
   log.info("inside publisherArchiveCampList");
   var pID = url.parse(req.url, true).query.pID;
   var errors;
 
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   var acceptCampaign = properties.get('pubStatus.acceptCampaign');
   var completed = properties.get('agencyStatus.completeCampaign');
   var pausedInComplete = properties.get('pubStatus.paused_incomplete');
   var liveInComplete = properties.get('pubStatus.live_incomplete');
   var clientAcceptedStatus = properties.get('clientReviewLead.clientAccepted.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var sql = "SELECT c.clientCampID,c.parentCampID,c.reallocationID,c.agencyID,c.requiredLeadPerAsset,pa.campID,pa.pID, pa.startDate, pa.endDate, pa.status, sum(pa.allocatedLead) As allocatedLead,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead,c.campaignName,c.timezone,c.leadAllocation,c.ABM from publisher_allocation pa join campaign c  on pa.campID = c.campID join user_mapping um on um.pID=pa.pID and c.agencyID=um.agencyID where  pa.lastUpdated in (select MAX(pa.lastUpdated) from publisher_allocation pa    group by pa.lastUpdated) and (pa.pID='" + pID + "' AND pa.status='" + completed + "') OR (pa.pID='" + pID + "' AND pa.status='" + cancelALU + "') OR (pa.pID='" + pID + "' AND pa.status='" + pausedInComplete + "')  OR (pa.pID='" + pID + "' AND pa.status='" + liveInComplete + "') group by pa.campID order by pa.campID desc ";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.info("Error In publisherArchiveCampList" + error);
 
       return res.status(400).json(errors);
     } else {
 
       var sql1 = "select lf.campID,sd.supportDocID, lf.pID, lf.leadInfoID,lf.assetName,count(lf.leadInfoID) as leadInfoCount,c.leadAllocation,sd.leadPerAsset as leadCountPerAsset,c.requiredLeadPerAsset ,   if(count(lf.leadInfoID)>=sd.leadPerAsset,sd.leadPerAsset,count(lf.leadInfoID)) as acceptedLeadsPerAsset, sd.leadPercentage  from lead_info lf join lead_info_status ls on ls.leadInfoID=lf.leadInfoID join campaign c on    lf.campID=c.campID join supporting_document sd on sd.campID=lf.campID and sd.suppDocName=lf.assetName where (ls.status='Accepted' and  lf.pID='" + pID + "') or (ls.status='" + clientAcceptedStatus + "' and  lf.pID='" + pID + "') or (ls.status='" + agencyInternalReview + "' and  lf.pID='" + pID + "') group by sd.supportDocID";
       pool.query(sql1, function (error, leads, fields) {
         if (error) {
           log.error("Error=" + error);
           return res.status(400).json(errors);
         }
         else {
           for (var i = 0; i < results.length; i++) {
             var allocatedLead = parseInt(results[i].allocatedLead)
             var totAcceptedLead = 0;
             var assetLeads = 0.0;
             var leadInfoCount = 0;
             for (var j = 0; j < leads.length; j++) {
               if (leads[j].pID == results[i].pID && leads[j].campID == results[i].campID) {
                 var leadPercentage = parseFloat(leads[j].leadPercentage);
                 var aLead = allocatedLead * leadPercentage / 100;
                 assetLeads = assetLeads + parseFloat(aLead);
                 totAcceptedLead = totAcceptedLead + parseFloat(leads[j].acceptedLeadsPerAsset);
                 leadInfoCount = parseFloat(leads[j].leadInfoCount);
                 leadInfoCount = leadInfoCount + leadInfoCount;
               }
             }
             // results[i].totAcceptedLead=totAcceptedLead
             if (leadInfoCount >= assetLeads) {
               results[i].totAcceptedLead = Math.round(assetLeads);
             } else {
               results[i].totAcceptedLead = Math.round(totAcceptedLead);
             }
           }
           res.send(JSON.stringify(results));
           //pool.end();
         }
       });
       ////pool.end();
     }
   });
 
 });
 
 /**
  * @author Somnath Keswad
  * @param  Description Get Publisher Uploaded QA review  Lead
  * @return Description return Lead in JSON
  **/
 router.post('/qaReviewDownloadLeadDetails', authCheck,function (req, res, next) {
   log.info("In Publisher/qaReviewDownloadLeadDetails");
   var leadStatus = properties.get('download.QA_Review.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var DI_QA_Review = properties.get('download.DI_Review.status');
   let statusArray = [leadStatus, agencyInternalReview, DI_QA_Review]
   const { campID } = req.body;
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
   let timeout = 50;
   let sql1 = "select d.campID,d.campaignID,d.reAllocationID,d.leadInteractionDate,d.firstName,d.lastName,d.companyName,d.linkedInCompanyName,d.email,d.workPhone,d.jobTitle,d.linkedInJobTitle,d.jobLevel,d.jobFunction,d.country,d.address,d.street,d.city,d.state,d.zipCode,d.companyEmployeeSize,d.companyRevenue,d.industry,d.ip,d.supportDocID,d.assetName,d.assetNameTouch1,d.assetTimestampTouch1,d.assetNameTouch2,d.assetTimestampTouch2,d.assetNameTouch3,d.assetTimestampTouch3,d.extra1,d.extra2,d.extra3,d.extra4,d.extra5,d.linkedIn,d.comments,d.alternatePhoneNo,d.domain,d.additionalComments,c.callAudit,c.multiTouch from delivery_format d join campaign c on d.campID=c.campID  where d.campID='" + campID + "' "
   pool.query(sql1, function (error, deliveryResult, fields) {
     if (error) {
       log.error("Error Publisher/qaReviewDownloadLeadDetails:" + error);
       return res.status(400).json(error);
     }
     let leadCQ = "SELECT cq.campID as parentCampID,cq.leadInfoID,cq.customQuestion,cq.answer from lead_custom_questions cq left join lead_info_status lis ON cq.leadInfoID=lis.leadInfoID join campaign c on cq.campID=c.campID where  cq.campID='" + campID + "' AND cq.pID='" + pID + "' AND lis.status in (?)";
     pool.query(leadCQ, [statusArray], function (error, leadQuestionResult, fields) {
       if (error) {
         log.error("Error Publisher/qaReviewDownloadLeadDetails:" + error);
         return res.status(400).json(error);
       }
 
       let dfMapping = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "'";
       pool.query(dfMapping, function (error, mappingResult, fields) {
         if (error) {
           log.error("Error Publisher/qaReviewDownloadLeadDetails:" + error);
           return res.status(400).json(error);
         }
         deliveryResult = JSON.parse(JSON.stringify(deliveryResult).split('"campaignID":').join('"campID":'));
         var yesStatus = properties.get('deliveryFormatStatus.yes.status');
         let campaignArray = {};
         if (deliveryResult[0].reAllocationID === yesStatus) {
           campaignArray['reAllocationID'] = "";
         }
         if (deliveryResult[0].jobLevel === yesStatus) {
           campaignArray['jobLevel'] = "";
         }
         if (deliveryResult[0].jobFunction === yesStatus) {
           campaignArray['jobFunction'] = "";
         }
         if (deliveryResult[0].industry === yesStatus) {
           campaignArray['industry'] = "";
         }
         if (deliveryResult[0].companyEmployeeSize === yesStatus) {
           campaignArray['companyEmployeeSize'] = "";
         }
         if (deliveryResult[0].street === yesStatus) {//Somnath Task:3002, Add street if checked
           campaignArray['street'] = "";
         }
         if (deliveryResult[0].companyRevenue === yesStatus) {
           campaignArray['companyRevenue'] = "";
         }
         if (deliveryResult[0].ip === yesStatus) {
           campaignArray['ip'] = "";
         }
         if (deliveryResult[0].supportDocID === yesStatus) {
           campaignArray['supportDocID'] = "";
         }
         if (deliveryResult[0].callAudit === 'Yes') {
           campaignArray['voiceLogLink'] = "";
         }
         if (deliveryResult[0].extra1 === yesStatus) {
           campaignArray['extra1'] = "";
         }
         if (deliveryResult[0].extra2 === yesStatus) {
           campaignArray['extra2'] = "";
         }
         if (deliveryResult[0].extra3 === yesStatus) {
           campaignArray['extra3'] = "";
         }
         if (deliveryResult[0].extra4 === yesStatus) {
           campaignArray['extra4'] = "";
         }
         if (deliveryResult[0].extra5 === yesStatus) {
           campaignArray['extra5'] = "";
         }
         if (deliveryResult[0].domain === yesStatus) {
           campaignArray['domain'] = "";
         }
         if (deliveryResult[0].alternatePhoneNo === yesStatus) {
           campaignArray['alternatePhoneNo'] = "";
         }
         if (deliveryResult[0].linkedIn === yesStatus) {
           campaignArray['linkedIn'] = "";
         }
         if (deliveryResult[0].comments === yesStatus) {
           campaignArray['comments'] = "";
         }
         if (deliveryResult[0].multiTouch === yesStatus) {
           timeout = 500;
           let sql = "select supportDocID,suppDocName,campID,typeOfSuppDoc,multiTouch from supporting_document where campID='" + campID + "'and typeOfSuppDoc='Asset' and (status!='Removed' or status is null)"
           var multiTouchAsset = "";
           pool.query(sql, function (err, resultsAsset, fields) {
             if (err) {
               log.error("Error Publisher/qaReviewDownloadLeadDetails:" + error);
               return res.status(400).json(error);
             }
             else {
               var assetTouch1 = "", assetTouch2 = "", assetTouch3 = "";
               for (var i = 0; i < resultsAsset.length; i++) {
                 if (resultsAsset[i].multiTouch == "1st Touch") {
                   assetTouch1 = assetTouch1 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "2nd Touch") {
                   assetTouch2 = assetTouch2 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 if (resultsAsset[i].multiTouch == "3rd Touch") {
                   assetTouch3 = assetTouch3 + "|" + unescape(resultsAsset[i].suppDocName);
                 }
                 multiTouchAsset = multiTouchAsset + "|" + resultsAsset[i].multiTouch;
               }
               var onlyNum = (multiTouchAsset.match(/\d+/g).map(Number)).toString();
               onlyNum = onlyNum.split(',');
               var maxNum = Math.max(...onlyNum);
               if (maxNum === 3) {
                 three = true;
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 campaignArray['assetNameTouch3'] = "";
                 campaignArray['assetTimestampTouch3'] = "";
               }
               if (maxNum === 2) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 campaignArray['assetNameTouch2'] = "";
                 campaignArray['assetTimestampTouch2'] = "";
                 two = true;
               }
               if (maxNum === 1) {
                 campaignArray['assetNameTouch1'] = "";
                 campaignArray['assetTimestampTouch1'] = "";
                 one = true;
               }
             }
           });
         }
         else {
           campaignArray['assetName'] = "";
         }
         setTimeout(() => {
           let keys = Object.keys(campaignArray);
           let sql = "select li.leadInfoID,li.campID,li.pID,li.leadInteractionDate,li.firstName,li.lastName,li.email,li.companyName,li.linkedInCompanyName,li.workPhone,li.jobTitle,li.linkedInJobTitle,li.address,li.country,li.city,li.state,li.zipCode,li.companyEmployeeSize,li.industry,li.assetName,li." + keys.join(',li.') + ",lis.status,lr.reason from lead_info li left join lead_info_status lis ON li.leadInfoID=lis.leadInfoID  left join lead_info_reason lr ON li.leadInfoID=lr.leadInfoID where li.campID='" + campID + "' AND li.pID='" + pID + "' AND lis.status in (?) group by li.leadInfoID";//Supriya Task:3075 - grouping by leadInfoID because sometimes result have leadInfoID multiple
           pool.query(sql, [statusArray], function (error, leadResult, fields) {
             if (error) {
               log.error("Error inside qaReviewDownloadLeadDetails==>" + error);
               throw error;
             }
             else {
               const leadLength = leadResult.length;
               for (let i = 0; i < leadLength; i++) {
                 leadResult[i].assetName = unescape(leadResult[i].assetName);
                 var email = leadResult[i].email;
                 if (email.includes("@") == false) {
                   leadResult[i].email = cryptr.decrypt(leadResult[i].email);
                   leadResult[i].firstName = cryptr.decrypt(leadResult[i].firstName);
                   leadResult[i].lastName = cryptr.decrypt(leadResult[i].lastName);
                   leadResult[i].workPhone = cryptr.decrypt(leadResult[i].workPhone);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch1')) {
                   let touch1 = "assetNameTouch1";
                   leadResult[i][touch1] = unescape(leadResult[i][touch1]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch2')) {
                   let touch2 = "assetNameTouch2";
                   leadResult[i][touch2] = unescape(leadResult[i][touch2]);
                 }
                 if (leadResult[i].hasOwnProperty('assetNameTouch3')) {
                   let touch3 = "assetNameTouch3";
                   leadResult[i][touch3] = unescape(leadResult[i][touch3]);
                 }
               }//End of for loop leadResult
 
               if (leadLength > 0) {
                  //Supriya Task:3075 - using common function for lead key change as per mapping
                  new Promise(async (reject) => {
                   //Supriya Task:3075 - add try/catch block to call function
                   try {
                     //Supriya Task:3075 - use async/await function for wait still get result
                     leadResult = await uploadLeadFunction.leadDownloadFunction(leadResult, mappingResult, deliveryResult);
                
                   } catch (error) { reject(error) }//End of catch block
                 })//End of Promise
      
                 const leadCQLength = leadQuestionResult.length;
                 for (let i = 0; i < leadLength; i++) {
                   for (let j = 0; j < leadCQLength; j++) {
                     if (leadResult[i].leadInfoID === leadQuestionResult[j].leadInfoID) {
                       let question = 'CQ -' + unescape(leadQuestionResult[j].customQuestion);
                       let answer = unescape(leadQuestionResult[j].answer);
                       leadResult[i][question] = answer;
                     }
                   }// End of leadQuestionResult loop
                 }// End of LeadResult loop
 
                 setTimeout(() => {
 
                   leadResult.map(function (leadReasult) {
                     leadReasult['Lead Info ID'] = leadReasult["leadInfoID"];
                     delete leadReasult["leadInfoID"];
 
                     leadReasult['Status'] = leadReasult["status"];
                     delete leadReasult["status"];
 
                     leadReasult['Reason'] = leadReasult["reason"];
                     delete leadReasult["reason"];
 
                     leadReasult['Voice Log Link'] = leadReasult["voiceLogLink"];
                     delete leadReasult["voiceLogLink"];
                     return leadReasult;
                   });
                   res.send(JSON.stringify(leadResult));
                 }, 1000)
               } else {
                 let success = "No Data Exists";
                 res.json({ success: true, message: success });
               }
             }
           });//End of leadResult 
         }, timeout)
       });//End of Delivery_Format_Mapping
     });//End of lead_Custom_Question
   });//End of delivery_format
 });//End of qaReviewDownloadLeadDetails
 
 
 
 /*@author somnath keswad
  * Sanjana Godbole
  Get Campaign allocation details from publisherAlocation based on campID and Publisher ID
  @version 1.0
  */
 router.get("/allocatingCampaignIDPublisherSpecific",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside allocatingCampaignIDPublisherSpecific");
 
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var status = "Assign";
   // var status1="Accept";
   // var pendingStatus =properties.get('pubStatus.pendingCampaign');
   // var pausedInComplete=properties.get('pubStatus.paused_incomplete');
   // var liveInComplete=properties.get('pubStatus.live_incomplete');
   // var acceptedCounter =properties.get('agencyStatus.acceptCounter');
   pool.query(
 
     "select c.campID,c.campaignName,c.clientCampID,c.ABM,c.region,c.country,c.startDate,c.endDate,c.firstLeadDeliveryDate,c.timezone,c.budget,c.requiredLeadPerAsset,c.CPL,c.currency,(select sum(pa.allocatedLead)  from publisher_allocation pa where pa.status='Reject' and pa.campID='" + campID + "')as rejectedLead, c.leadAllocation,sum(pa.allocatedLead) as allocatedLead,pa.status,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead,sum(pa.allocatedLead*pa.cpl) as allocatedBudget ,round((c.budget-sum(pa.allocatedLead*pa.cpl)),2)as remainingBudget from campaign c left join publisher_allocation pa on c.campID = pa.campID and(pa.status='Assign') WHERE c.campID ='" + campID + "'", function (error, results, fields) {
       if (error) {
         log.error("Error inside allocatingCampaignIDPublisherSpecific==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
       //pool.end();
     }
   ); ////pool.end();
 });
 
 
 /*@author somnath keswad
  * Desc select the specific campaign which he click
  @version 1.0
  */
 //Somnath Task-3858, Add checkAuth middleware
 router.get("/allocatingCampaignID",authCheck, (req, res, next) => {
   log.info("Inside publisher/allocatingCampaignID");
   const campID = url.parse(req.url, true).query.campID;
   let accept = properties.get('pubStatus.acceptCampaign');
   let assign = properties.get('agencyStatus.newAllocation');
   let pendingStatus = properties.get('pubStatus.pendingCampaign');
   let pausedInComplete = properties.get('pubStatus.paused_incomplete');
   let liveInComplete = properties.get('pubStatus.live_incomplete');
   let acceptedCounter = properties.get('agencyStatus.acceptCounter');
   const docType = "ABM";
   let sql = "select c.campID,c.parentCampID,c.reallocationID,c.campaignName,c.clientCampID,c.ABM,c.region,c.country,c.startDate,c.endDate,c.firstLeadDeliveryDate,c.timezone,c.budget,c.requiredLeadPerAsset,c.CPL,c.currency,c.noOfLeadPerDomain,(select sum(pa.allocatedLead)  from publisher_allocation pa where pa.status='Reject' and pa.campID='" + campID + "')as rejectedLead, c.leadAllocation,sum(pa.allocatedLead) as allocatedLead,pa.status,(c.leadAllocation - sum(pa.allocatedLead)) AS pendingLead,sum(pa.allocatedLead*pa.cpl) as allocatedBudget ,(c.budget-sum(pa.allocatedLead*pa.cpl))as remainingBudget from campaign c left join publisher_allocation pa on c.campID = pa.campID and(pa.status='" + assign + "' OR pa.status='" + accept + "' OR pa.status='" + pendingStatus + "' OR pa.status='" + pausedInComplete + "' OR pa.status='" + liveInComplete + "' OR pa.status='" + acceptedCounter + "') WHERE c.campID ='" + campID + "'"
   pool.query(sql, (error, results, fields) => {
     if (error) {
       log.error("Error Publisher/allocatingCampaignID:" + error);
       return res.status(400).json(error);
     }
     let sql = "select campID, sum(fileRecordCount) as abmCount from supporting_document where campID='" + campID + "' and typeOfSuppDoc='" + docType + "'";
     pool.query(sql, (error, docInfo, fields) => {
       if (error) {
         log.error("Error Publisher/allocatingCampaignID:" + error);
         return res.status(400).json(error);
       }
       results.map((a) => Object.assign(a, docInfo.find(b => a.campID == b.campID)))
       if (!results[0].hasOwnProperty('abmCount')) {
         results[0].abmCount = 0;
       }
       res.send(JSON.stringify(results));
     });
   });
 });// End of allocatingCampaignID
 
 
 /**
   * @author Supriya Gore
   * @param  Description Decrypt Leads data
   * @return Description return decrypted data
   */
 function decrypt(text, encryptionKey, encryptionIV) {
   //  let iv = Buffer.from(text.iv, 'hex');
   let encryptedText = Buffer.from(text, 'hex');
   let decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), Buffer.from(encryptionIV, 'hex'));
   let decrypted = decipher.update(encryptedText);
   decrypted = Buffer.concat([decrypted, decipher.final()]);
   return decrypted.toString();
 }
 
 /**
 * @author Somnath Keswad
 * @param  Description handle pass the Data for download excel file of lead Status
 * @return Description return the Response Data for Excel
 */
 router.post('/downloadAuditReport', function (req, res, next) {
   log.info("inside downloadAuditReport");
   var campID = req.body.campID;
   var parentCampID = req.body.parentCampID;
   var reallocationID = req.body.reallocationID;
   var user = req.body.user;
   var listLeadInfoID = req.body.listLeadInfoID;
   var leadinfoIDList = [];/** Getting data of selected leadInfoId */
   for (var i = 0; i < listLeadInfoID.length; i++) {
     leadinfoIDList.push(listLeadInfoID[i].leadInfoID);
   }
 
 
   var sql = "select lf.leadInfoID, lf.campID,c.parentCampID, c.campaignName, lf.leadInteractionDate,lf.email,ls.status from lead_info lf join lead_info_status ls on lf.leadInfoID=ls.leadInfoID join campaign c on lf.campID=c.campID where lf.campID='" + campID + "' and lf.reAllocationID='" + reallocationID + "' and lf.pID='" + user.id + "' and lf.leadInfoId in(?)";
 
   pool.query(sql, [leadinfoIDList], function (error, results, fields) {
     if (error) {
       log.error("Error inside downloadAuditReport==>" + error);
       throw error;
     } else {
       for (var k = 0; k < results.length; k++) {
 
         // let decryptedEmail = decrypt(results[k].email,results[k].encryptKey,results[k].encryptIV);
         // results[k].email=decryptedEmail.toString();
         var email = results[k].email;
         if (email.includes("@") == false) {
           results[k].email = cryptr.decrypt(results[k].email);
         }
       }
       var output = [];
       var leadArray = [];
       leadArray.push(results);
       results.forEach(function (item) {
         var existing = output.filter(function (v, i) {
           return v.leadInfoID == item.leadInfoID;
         });
         if (existing.length) {
           var existingIndex = output.indexOf(existing[0]);
           output[existingIndex].status = output[existingIndex].status.concat(" | " + item.status);
         } else {
           if (typeof item.status == 'string')
             item.status = item.status;
           output.push(item);
         }
       });
       /** Change Column Name */
       var data = [];
       for (var i = 0; i < output.length; i++) {
         data.push({ 'Lead Info ID': output[i].leadInfoID, 'Campaign ID': output[i].parentCampID, 'Campaign Name': output[i].campaignName, 'Lead Interaction Date': output[i].leadInteractionDate, 'Email': output[i].email, 'Status': output[i].status })
       }
       res.send(JSON.stringify(data));
       //pool.end();
     }
   });
 });
 
 /**
 * @author Somnath Keswad
 * @param  Description Validate the extension which in uploaded File and Campaign Creation choosen delivery Option
 * @return Description return the extension of that file.
 */
 router.get("/getDeliveryFileExtension", function (req, res, next) {
   log.info("inside getDeliveryFileExtension");
   var campID = url.parse(req.url, true).query.campID;
   var errors;
   var sql = "SELECT campID, leadDeliveryOption from campaign where campID='" + campID + "' ";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error inside getDeliveryFileExtension==>" + error);
       return res.status(400).json(errors);
     } else {
       res.send(JSON.stringify(results));
       //pool.end();
     }
   });
   // //pool.end();
 });
 
 module.exports = router;
 
 /**
  * @author Somnath Keswad
  * Desc displaying all lp without selecting publisher
  * @version 1.0
  **/
 router.get("/landingPageDetails", function (req, res, next) {
   log.info("In Publisher/landingPageDetails");
   var campID = url.parse(req.url, true).query.campID;
   var errors;
   var pendingSubmission = properties.get('agencyStatus.pendingSubmission')
   pool.query(
     "select ld.id as landingPageID,ld.id as ldID,ld.campID,p.publisherName,p.pID, ld.supportDocID, sd.suppDocName,ld.lpLink, ld.status as lpStatus, ld.feedback as lpFeedback,lpFeedbackFileName,ld.status as lp_status,sd.status as assetStatus from landing_page_details ld join publisher p on p.pID = ld.pID join supporting_document sd  on sd.supportDocID = ld.supportDocID   where ld.campID='" + campID + "' and ld.status!='" + pendingSubmission + "'",
     function (error, creativeReview, fields) {
       if (error) {
         log.error("Error Publisher/landingPageDetails:" + error);
         return res.status(400).json(error);
       } else {
 
         pool.query(
           "select pd.id as pdID,pd.campID,p.publisherName,p.pID, pd.supportDocID,pd.pocFileName,sd.suppDocName,pd.status as pocStatus,pd.status as poc_status,pd.feedback as pocFeedback,pocFeedbackFileName,sd.status as assetStatus from poc_details pd join publisher p on p.pID = pd.pID join supporting_document sd  on sd.supportDocID = pd.supportDocID   where pd.campID='" + campID + "' and pd.status!='" + pendingSubmission + "'",
           function (error, POCReviewPendingList, fields) {
             if (error) {
               log.error("Error Publisher/landingPageDetails:" + error);
               return res.status(400).json(error);
             } else {
               var lpReviewPendingList = [];
               var lpLength = creativeReview.length;
               var pocLength = POCReviewPendingList.length;
               if (lpLength > pocLength) {
                 lpReviewPendingList = creativeReview.map(x => Object.assign(x, POCReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
               } else if (pocLength > lpLength) {
                 lpReviewPendingList = POCReviewPendingList.map(x => Object.assign(x, creativeReview.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
               } else {
                 lpReviewPendingList = POCReviewPendingList.map(x => Object.assign(x, creativeReview.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
               }
 
               var ldIDList = []
               for (let i = 0; i < lpReviewPendingList.length; i++) {
                 if (lpReviewPendingList[i].landingPageID === undefined || lpReviewPendingList[i].landingPageID === 'undefined' || lpReviewPendingList[i].landingPageID === 'null' || lpReviewPendingList[i].landingPageID === null || lpReviewPendingList[i].landingPageID === '') { }
                 else {
                   ldIDList.push(lpReviewPendingList[i].landingPageID);
                 }
               }
               if (ldIDList.length === 0) { ldIDList = [0] }
 
               var pdIDList = []
               for (let i = 0; i < lpReviewPendingList.length; i++) {
                 if (lpReviewPendingList[i].pdID === undefined || lpReviewPendingList[i].pdID === 'null') { }
                 else {
                   pdIDList.push(lpReviewPendingList[i].pdID);
                 }
               }
               if (pdIDList.length === 0) { pdIDList = [0] }
 
               var sql = "select ld.id as ldID,ld.campID,p.publisherName,p.pID, ld.supportDocID, sd.suppDocName,ld.lpLink, ld.status as lpStatus, ld.status as lp_status,ld.feedback as lpFeedback,lpFeedbackFileName,sd.status as assetStatus from landing_page_details ld join publisher p on p.pID = ld.pID join supporting_document sd  on sd.supportDocID = ld.supportDocID   where ld.campID='" + campID + "' and ld.status!='" + pendingSubmission + "' and ld.id NOT In(?)";
               pool.query(sql, [ldIDList], function (error, results, fields) {
                 if (error) {
                   log.error("Error Publisher/landingPageDetails:" + error);
                   return res.status(400).json(error);
                 } else {
                   lpReviewPendingList = lpReviewPendingList.concat(results);
                   var sql1 = "select pd.id as pdID,pd.campID,p.publisherName,p.pID, pd.supportDocID,pd.pocFileName,sd.suppDocName,pd.status as pocStatus,pd.status as poc_status,pd.feedback as pocFeedback,pocFeedbackFileName,sd.status as assetStatus from poc_details pd join publisher p on p.pID = pd.pID join supporting_document sd  on sd.supportDocID = pd.supportDocID   where pd.campID='" + campID + "' and pd.status!='" + pendingSubmission + "' and pd.id NOT IN (?)";
                   pool.query(sql1, [pdIDList], function (error, results1, fields) {
                     if (error) {
                       log.error("Error Publisher/landingPageDetails:" + error);
                       return res.status(400).json(error);
                     } else {
                       lpReviewPendingList = lpReviewPendingList.concat(results1);
                       var sql2 = "select cs.id as callScriptID,cs.campID,p.publisherName,p.pID, cs.supportDocID ,sd.suppDocName,cs.csFileName, cs.status as csStatus, cs.feedback as csFeedback,csFeedbackFileName,cs.status as cs_status,sd.status as assetStatus from call_script_details cs join publisher p on p.pID = cs.pID join supporting_document sd  on sd.supportDocID = cs.supportDocID where cs.campID='" + campID + "' and cs.status!='" + pendingSubmission + "'";
                       pool.query(sql2, function (err, resultCs, fields) {
                         if (err) {
                           log.error("Error Publisher/landingPageDetails:" + error);
                           return res.status(400).json(error);
                         }
                         else {
                           var csLength = resultCs.length;
                           var finalResultLength = lpReviewPendingList.length;
                           var FinalReviewPendingList = [];
                           if (csLength > finalResultLength) {
                             FinalReviewPendingList = resultCs.map(x => Object.assign(x, lpReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                           }
                           else if (finalResultLength > csLength) {
                             FinalReviewPendingList = lpReviewPendingList.map(x => Object.assign(x, resultCs.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                           }
                           else {
                             FinalReviewPendingList = lpReviewPendingList.map(x => Object.assign(x, resultCs.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                           }
 
                           var csIDList = []
                           for (var i = 0; i < FinalReviewPendingList.length; i++) {
                             if (FinalReviewPendingList[i].callScriptID === undefined || FinalReviewPendingList[i].callScriptID === 'null') { }
                             else {
                               csIDList.push(FinalReviewPendingList[i].callScriptID);
                             }
                           }
                           if (csIDList.length === 0) { csIDList = [0] }
                           var csQuery = "select cs.id as callScriptID,cs.campID,p.publisherName,p.pID, cs.supportDocID, sd.suppDocName,cs.csFileName,cs.status as csStatus,cs.status as cs_status,cs.feedback as csFeedback,csFeedbackFileName,sd.status as assetStatus from call_script_details cs join publisher p on p.pID = cs.pID join supporting_document sd  on sd.supportDocID = cs.supportDocID  where cs.campID='" + campID + "' and cs.status!='" + pendingSubmission + "' and cs.id NOT In(?)"
 
                           pool.query(csQuery, [csIDList], function (error, resultsCS, fields) {
                             if (error) {
                               log.error("Error Publisher/landingPageDetails:" + error);
                               return res.status(400).json(error);
                             } else {
                               FinalReviewPendingList = FinalReviewPendingList.concat(resultsCS);
                               for (let i = 0; i < lpReviewPendingList.length; i++) {
                                 let { supportDocID, pID } = lpReviewPendingList[i];
                                 let tmp = [lpReviewPendingList[i]]
                                 let chk = FinalReviewPendingList.filter((a) => a.supportDocID == supportDocID && a.pID == pID);
                                 if (chk.length > 0) {
                                   FinalReviewPendingList.map(x => Object.assign(x, tmp.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                 } else {
 
                                   FinalReviewPendingList = FinalReviewPendingList.concat(tmp);
                                 }
                               }
                               for (let i = 0; i < FinalReviewPendingList.length; i++) {
                                 FinalReviewPendingList[i].suppDocName = unescape(FinalReviewPendingList[i].suppDocName);
                               }
                               FinalReviewPendingList.sort((a, b) => a.supportDocID - b.supportDocID)
                               res.send(JSON.stringify(FinalReviewPendingList));
                             }
                           });
                         }
                       });
                     }
                   });
                 }
               });
             }
           });
       }
     });
 });// End of landingPageDetails
 
 /**
       * @author Supriya Gore
       * @param  Description handle the LP/POC/CS upload
       * @return Description return All LP/POC/CS upload
       */
 router.post("/creativeUploadDetails", function (req, res, next) {
   log.info("inside creativeUploadDetails");
   var campID = req.body.campID;
   var pID = req.body.pID;
   var errors;
   var pendingSubmission = properties.get('agencyStatus.pendingSubmission');
   var Asset = 'Asset';
   var lp_poc_cs_existResult = [];
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
   var sqlDelete = "delete from poc_details where campID='" + campID + "' and status='waitingForSubmit'";
   pool.query(sqlDelete, function (err, result, fields) {
     if (err) {
       log.error("error inside publisher/creativeUploadDetails==>" + err)
     }
     else {
     }
   })
 
   var sqlDeleteCS = "delete from call_script_details where campID='" + campID + "' and status='waitingForSubmit'";
   pool.query(sqlDeleteCS, function (errCS, result, fields) {
     if (errCS) {
       log.error("error inside publisher/creativeUploadDetails==>" + errCS)
     }
     else {
     }
   })
 
   setTimeout(function () {
     var ldsql = "SELECT supportDocID from landing_page_details where campID=" + campID + " AND pID=" + pID + "";
     pool.query(ldsql,
       function (error, lpResult, fields) {
         if (error) {
           log.error("Error inside creativeUploadDetails==>" + error);
           return res.status(400).json(errors);
         } else {
           lp_poc_cs_existResult = lp_poc_cs_existResult.concat(lpResult);
           var pdsql = "SELECT supportDocID from poc_details where campID=" + campID + " AND pID=" + pID + " and status!='waitingForSubmit'";
           pool.query(pdsql,
             function (error, pocResult, fields) {
               if (error) {
                 log.error("Error===" + error);
                 return res.status(400).json(errors);
               } else {
                 lp_poc_cs_existResult = lp_poc_cs_existResult.concat(pocResult);
                 var cssql = "SELECT supportDocID from call_script_details where campID=" + campID + " AND pID=" + pID + " and status!='waitingForSubmit'";
                 pool.query(cssql,
                   function (error, csResult, fields) {
                     if (error) {
                       log.error("Error inside creativeUploadDetails==>" + error);
                       return res.status(400).json(errors);
                     } else {
                       lp_poc_cs_existResult = lp_poc_cs_existResult.concat(csResult);
                       if (lp_poc_cs_existResult.length > 0) {
                         // res.send(JSON.stringify(pocResults));
                         var blank = "";
                         var sqlQuery = "select ld.id as landingPageID,ld.campID,p.publisherName,p.pID, ld.supportDocID, sd.suppDocName,ld.lpLink, ld.status as lpStatus, ld.feedback as lpFeedback,lpFeedbackFileName,ld.status as lp_status,ld.sslFeedback ,sd.status as assetStatus from landing_page_details ld join publisher p on p.pID = ld.pID join supporting_document sd  on sd.supportDocID = ld.supportDocID   where ld.campID='" + campID + "' and ld.lpLink <> '" + blank + "' and ld.pID='" + pID + "' and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null)";
                         pool.query(sqlQuery, function (error, creativeReview, fields) {
                           if (error) {
                             log.error("Error inside creativeUploadDetails==>" + error);
                             return res.status(400).json(errors);
                           } else {
                             var listSuppDoc = [];
 
                             for (var i = 0; i < creativeReview.length; i++) {
                               listSuppDoc.push(creativeReview[i].supportDocID);
                             }
                             pool.query(
                               "select pd.id as pdID,pd.campID,p.publisherName,p.pID, pd.supportDocID,pd.pocFileName,sd.suppDocName,pd.status as pocStatus, pd.feedback as pocFeedback,pocFeedbackFileName,sd.status as assetStatus from poc_details pd join publisher p on p.pID = pd.pID join supporting_document sd  on sd.supportDocID = pd.supportDocID   where pd.campID='" + campID + "' and pd.pID='" + pID + "' and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null)",
                               function (error, POCReviewPendingList, fields) {
                                 if (error) {
 
                                   log.error("Error inside creativeUploadDetails==>" + error);
                                   return res.status(400).json(errors);
                                 } else {
                                   for (var i = 0; i < POCReviewPendingList.length; i++) {
                                     listSuppDoc.push(POCReviewPendingList[i].supportDocID);
                                   }
 
                                   pool.query(
                                     "select cd.id as csID,cd.campID,p.publisherName,p.pID, cd.supportDocID,cd.csFileName,sd.suppDocName,cd.status as csStatus, cd.feedback as csFeedback,csFeedbackFileName,sd.status as assetStatus from call_script_details cd join publisher p on p.pID = cd.pID join supporting_document sd  on sd.supportDocID = cd.supportDocID   where cd.campID='" + campID + "' and cd.pID='" + pID + "'  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null)",
                                     function (error, CSReviewPendingList, fields) {
                                       if (error) {
 
                                         log.error("Error inside creativeUploadDetails==>" + error);
                                         return res.status(400).json(errors);
                                       } else {
                                         for (var i = 0; i < CSReviewPendingList.length; i++) {
                                           listSuppDoc.push(CSReviewPendingList[i].supportDocID);
                                         }
                                         const suppDocResultData = [...new Set(listSuppDoc)];
                                         var query3;
                                         if (suppDocResultData.length > 0) {
                                           query3 = "select sd.campID,sd.supportDocID,sd.suppDocName,c.clientCampID,c.agencyID,sd.status as assetStatus from supporting_document sd join campaign c on sd.campID=c.campID where sd.campID='" + campID + "' and sd.typeOfSuppDoc='" + Asset + "' and sd.supportDocID NOT IN(" + [suppDocResultData] + ")  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null) order by sd.supportDocID asc"
                                         }
                                         else {
                                           query3 = "select sd.campID,sd.supportDocID,sd.suppDocName,c.clientCampID,c.agencyID,sd.status as assetStatus from supporting_document sd join campaign c on sd.campID=c.campID where sd.campID='" + campID + "' and sd.typeOfSuppDoc='" + Asset + "'  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null) order by sd.supportDocID asc"
                                         }
 
                                         pool.query(query3, function (error, suppResults, fields) {
                                           if (error) {
                                             log.error('\x1b[31m: ', "Error In Poc " + error, '\x1b[0m');
                                             return res.status(400).json(errors);
                                           }
                                           else {
 
                                             var LP_POC_CS_List = [];
                                             var lpLength = creativeReview.length;
                                             var pocLength = POCReviewPendingList.length;
                                             var csLength = CSReviewPendingList.length;
                                             var supLength = suppResults.length;
                                             if (lpLength > pocLength) {
                                               var mergedArray = creativeReview.map(x => Object.assign(x, POCReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               if (mergedArray.length > supLength) {
                                                 LP_POC_CS_List = mergedArray.map(x => Object.assign(x, suppResults.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               } else {
                                                 LP_POC_CS_List = suppResults.map(x => Object.assign(x, mergedArray.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               }
                                             } else if (pocLength > lpLength) {
                                               var mergedArray = POCReviewPendingList.map(x => Object.assign(x, creativeReview.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               if (mergedArray.length > supLength) {
                                                 LP_POC_CS_List = mergedArray.map(x => Object.assign(x, suppResults.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               } else {
                                                 LP_POC_CS_List = suppResults.map(x => Object.assign(x, mergedArray.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               }
                                             } else {
                                               var mergedArray = POCReviewPendingList.map(x => Object.assign(x, creativeReview.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               if (mergedArray.length > supLength) {
                                                 LP_POC_CS_List = mergedArray.map(x => Object.assign(x, suppResults.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               } else {
                                                 LP_POC_CS_List = suppResults.map(x => Object.assign(x, mergedArray.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               }
                                             }
                                             if (CSReviewPendingList.length > LP_POC_CS_List.length) {
                                               var mergedArray = CSReviewPendingList.map(x => Object.assign(x, LP_POC_CS_List.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               if (mergedArray.length > supLength) {
                                                 LP_POC_CS_List = mergedArray.map(x => Object.assign(x, suppResults.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               } else {
                                                 LP_POC_CS_List = suppResults.map(x => Object.assign(x, mergedArray.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               }
                                             } else if (LP_POC_CS_List.length > CSReviewPendingList.length) {
                                               var mergedArray = LP_POC_CS_List.map(x => Object.assign(x, CSReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               if (mergedArray.length > supLength) {
                                                 LP_POC_CS_List = mergedArray.map(x => Object.assign(x, suppResults.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               } else {
                                                 LP_POC_CS_List = suppResults.map(x => Object.assign(x, mergedArray.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               }
                                             } else {
                                               var mergedArray = LP_POC_CS_List.map(x => Object.assign(x, CSReviewPendingList.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               if (mergedArray.length > supLength) {
                                                 LP_POC_CS_List = mergedArray.map(x => Object.assign(x, suppResults.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               } else {
                                                 LP_POC_CS_List = suppResults.map(x => Object.assign(x, mergedArray.find(y => y.supportDocID === x.supportDocID && y.pID === x.pID)));
                                               }
                                             }
 
 
 
 
                                             var ldIDList = []
                                             for (var i = 0; i < LP_POC_CS_List.length; i++) {
                                               if (LP_POC_CS_List[i].landingPageID === undefined || LP_POC_CS_List[i].landingPageID === 'undefined' || LP_POC_CS_List[i].landingPageID === 'null' || LP_POC_CS_List[i].landingPageID === null || LP_POC_CS_List[i].landingPageID === '') { }
                                               else {
                                                 ldIDList.push(LP_POC_CS_List[i].landingPageID);
                                               }
                                             }
                                             if (ldIDList.length === 0) { ldIDList = [0] }
 
                                             var pdIDList = []
                                             for (var i = 0; i < LP_POC_CS_List.length; i++) {
                                               if (LP_POC_CS_List[i].pdID === undefined || LP_POC_CS_List[i].pdID === 'null') { }
                                               else {
                                                 pdIDList.push(LP_POC_CS_List[i].pdID);
                                               }
                                             }
                                             var csIDList = []
                                             for (var i = 0; i < LP_POC_CS_List.length; i++) {
                                               if (LP_POC_CS_List[i].csID === undefined || LP_POC_CS_List[i].csID === 'null') { }
                                               else {
                                                 csIDList.push(LP_POC_CS_List[i].csID);
                                               }
                                             }
 
                                             if (pdIDList.length === 0) { pdIDList = [0] }
                                             if (csIDList.length === 0) { csIDList = [0] }
                                             var blankVal = "";
 
                                             var sql = "select ld.id as ldID,ld.campID,p.publisherName,p.pID,c.agencyID,c.clientCampID, ld.supportDocID, sd.suppDocName,ld.lpLink, ld.status as lpStatus, ld.feedback as lpFeedback,lpFeedbackFileName,ld.sslFeedback ,sd.status as assetStatus from landing_page_details ld join publisher p on p.pID = ld.pID join supporting_document sd  on sd.supportDocID = ld.supportDocID join campaign c on ld.campID=c.campID   where ld.campID='" + campID + "' and ld.pID='" + pID + "' and ld.lpLink <> '" + blankVal + "' and ld.id NOT IN (?)  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null)";
                                             pool.query(sql, [ldIDList], function (error, results, fields) {
                                               if (error) {
                                                 log.error("Error In LP Creative Review" + error);
 
                                               } else {
 
 
 
                                                 LP_POC_CS_List = LP_POC_CS_List.concat(results);
                                                 var sql1 = "select pd.id as pdID,pd.campID,p.publisherName,p.pID, pd.supportDocID,c.agencyID,c.clientCampID,pd.pocFileName,sd.suppDocName,pd.status as pocStatus, pd.feedback as pocFeedback,pocFeedbackFileName,sd.status as assetStatus from poc_details pd join publisher p on p.pID = pd.pID join supporting_document sd  on sd.supportDocID = pd.supportDocID join campaign c on pd.campID=c.campID  where pd.campID='" + campID + "' and pd.pID='" + pID + "' and pd.id NOT IN (?)  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null)";
                                                 pool.query(sql1, [pdIDList], function (error, results1, fields) {
                                                   if (error) {
                                                     log.error("Error In LP Creative Review" + error);
 
                                                   } else {
                                                     LP_POC_CS_List = LP_POC_CS_List.concat(results1);
 
                                                     var csSql1 = "select cs.id as csID,cs.campID,p.publisherName,p.pID, cs.supportDocID,c.agencyID,c.clientCampID,cs.csFileName,sd.suppDocName,cs.status as csStatus, cs.feedback as csFeedback,csFeedbackFileName,sd.status as assetStatus from call_script_details cs join publisher p on p.pID = cs.pID join supporting_document sd  on sd.supportDocID = cs.supportDocID join campaign c on cs.campID=c.campID  where cs.campID='" + campID + "' and cs.pID='" + pID + "' and cs.id NOT IN (?)  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null)";
                                                     pool.query(csSql1, [csIDList], function (error, csResults1, fields) {
                                                       if (error) {
                                                         log.error("Error In CS Creative Review" + error);
 
                                                       } else {
                                                         const suppDocResultData1 = [...new Set(listSuppDoc)];
                                                         // LP_POC_CS_List.concat(results);
                                                         // LP_POC_CS_List.concat(results1);
                                                         LP_POC_CS_List = LP_POC_CS_List.concat(csResults1);
 
 
                                                         var sqlQuery3 = "select sd.campID,sd.supportDocID,sd.suppDocName,c.clientCampID,c.agencyID,sd.status as assetStatus from supporting_document sd join campaign c on sd.campID=c.campID where sd.campID='" + campID + "' and sd.typeOfSuppDoc='" + Asset + "' and sd.supportDocID NOT IN(?)  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null) order by sd.supportDocID asc";
                                                         pool.query(sqlQuery3, [suppDocResultData1], function (error, suppResults, fields) {
                                                           if (error) {
                                                             log.error("Error In Poc " + error);
 
                                                             return res.status(400).json(errors);
                                                           }
                                                           else {
 
                                                             LP_POC_CS_List = LP_POC_CS_List.concat(suppResults);
                                                             const merged = LP_POC_CS_List.reduce((acc, o) => {
                                                               acc[o.supportDocID] = Object.assign(acc[o.supportDocID] || {}, o)
                                                               return acc;
                                                             }, {})
 
                                                             const output = Object.values(merged);
                                                             for (var i = 0; i < output.length; i++) {
                                                               output[i].suppDocName = unescape(output[i].suppDocName);
                                                             }
                                                             //var LP_POC_CS_UniqueArray=unique(LP_POC_CS_List);
                                                             const LP_POC_CS_UniqueArray = [...new Set(output)];
                                                             setTimeout(() => {
                                                               res.send(JSON.stringify(LP_POC_CS_UniqueArray));
                                                             }, 1000);
                                                           }
                                                         });
                                                       }
                                                     });
                                                   }
                                                 });
 
                                               }
                                             });
 
                                           }
                                         });
 
                                       }
                                     });
                                 }
 
                               });
                           }
 
                         });
 
                       } else {
                         var query1 = "SELECT sd.campID,pa.pID, sd.supportDocID,sd.suppDocName,c.clientCampID,c.agencyID,sd.status as assetStatus from supporting_document sd join publisher_allocation pa on pa.campID = sd.campID  join campaign c on sd.campID=c.campID  where pa.pID='" + pID + "' and sd.campID='" + campID + "' AND sd.typeOfSuppDoc='" + Asset + "'  and (sd.deletedFlag!='" + deleteFlagYesStatus + "' or sd.deletedFlag is null) group by sd.supportDocID";
                         pool.query(query1, function (error, results, fields) {
                           if (error) {
                             log.error("Error=" + error);
                           }
                           else {
                             for (var i = 0; i < results.length; i++) {
                               results[i].suppDocName = unescape(results[i].suppDocName);
                             }
                             res.send(JSON.stringify(results));
                             //pool.end();
                           }
                         });
                       }
                     }
                   })
               }
             })
         }
       })
 
   }, 700)
 
   // //pool.end();
 });
 /**
  * @author Supriya Gore
  * @param  Description handle the dynamic campaign specification
  * @return Description return All The File Download in pdf
  */
 router.get("/downloadDynamicPDFCampaignDetailsforPublisher", function (req, res, next) {
 
   log.info("inside downloadDynamicPDFCampaignDetailsforPublisher");
   var campID = url.parse(req.url, true).query.campID;
   //var campaignName = url.parse(req.url, true).query.campName;
   var pID = url.parse(req.url, true).query.userID;
   var cancelTab = url.parse(req.url, true).query.cancelTab;
   var cancelCampaign = properties.get('agencyStatus.campaignStatus.cancelCampaign')
   var cancel = properties.get('agencyStatus.cancel');
   var reject = properties.get('pubStatus.rejectCampaign');
   var rejectedCounter = properties.get('agencyStatus.rejectCounter');
   const deleteFlagYesStatus = properties.get('SupportingDocument.deletedFlag.Yes_status');
   // else
   // {
     //Somnath Task-3618, Add excludedDomain in below sql statement
   if (cancelTab == "Cancel") {
     //sonali-task 3189-added subContracting in the query
     var sql = "select c.campID,c.parentCampID,c.callAudit,c.reallocationID,c.clientCampID,c.campaignName,c.requiredLPApproval,c.clientName,c.jobTitle,c.jobTitleValidation,c.jobLevel,c.jobFunction,c.industry,c.customIndustry,c.campaignStatus,c.region,c.country,c.state,c.stateFileName,c.city,c.cityFileName,c.zipCode,c.zipCodeFileName,c.timezone,c.ABM,c.campaignReportingDay,c.leadDeliveryOption,c.pacing,c.pacingLeadAllocation,c.insertionOrder,c.marketingChannel,c.otherSpecs,c.noOfLeadPerDomain ,c.createdByCompanyName,c.status,c.created,c.lastUpdated,c.budget,c.currency,c.employeeSize,c.agencyID,c.companyRevenue,c.lpTimeline,c.customEmpSize,c.customCompRevenue, sum(pa.allocatedLead) As allocatedLead,pa.startDate, max(pa.endDate) as endDate, max(pa.firstLeadDeliveryDate) as firstLeadDeliveryDate,c.customJobFunction,c.customJobLevel,c.requiredLeadPerAsset,c.multiTouch,c.leadInteractionDays,c.creativeApprovalRequiredFor,c.requiredCountryWiseAllocation,c.leadAllocation,c.subContracting,c.excludedDomain,c.excludedIndustryFlag,c.excludedIndustryFileName from campaign c join publisher_allocation pa on c.campID=pa.campID WHERE c.campID = ? and pa.pID='" + pID + "' and (pa.status ='" + cancel + "' OR c.campaignStatus='" + cancelCampaign + "') group by c.campID";
   }
   else {
     //Supriya Task:3091 - query changed for getting customQuestionAliasName value
     var sql = "select c.campID,c.parentCampID,c.callAudit,c.reallocationID,rd.biddingType,rd.countrywiseLeadAllocation,c.clientCampID,c.campaignName,c.requiredLPApproval,c.clientName,c.jobTitle,c.jobTitleValidation,c.jobLevel,c.jobFunction,c.industry,c.customIndustry,c.campaignStatus,c.region,c.country,c.state,c.stateFileName,c.city,c.cityFileName,c.zipCode,c.zipCodeFileName,c.timezone,c.ABM,c.campaignReportingDay,c.leadDeliveryOption,c.pacing,c.pacingLeadAllocation,c.insertionOrder,c.marketingChannel,c.otherSpecs,c.noOfLeadPerDomain ,c.createdByCompanyName,c.status,c.created,c.lastUpdated,c.budget,c.currency,c.employeeSize,c.agencyID,c.companyRevenue,c.lpTimeline,c.customEmpSize,c.customCompRevenue, sum(pa.allocatedLead) As allocatedLead,pa.startDate, max(pa.endDate) as endDate, max(pa.firstLeadDeliveryDate) as firstLeadDeliveryDate,c.customJobFunction,c.customJobLevel,c.requiredLeadPerAsset,c.multiTouch,c.leadInteractionDays,c.creativeApprovalRequiredFor,c.requiredCountryWiseAllocation,c.leadAllocation,c.customQuestionAliasName,c.subContracting,c.excludedDomain,c.excludedIndustryFlag,c.excludedIndustryFileName from campaign c left join rfp_bidding_detail rd on rd.campID=c.rfpProposalID join publisher_allocation pa on c.campID=pa.campID WHERE c.campID = ? and pa.pID='" + pID + "' and pa.status NOT IN('" + cancel + "','" + reject + "','" + rejectedCounter + "') group by c.campID";
   }
 
 
   pool.query(sql, [campID],
     function (error, resultsCamp, fields) {
       if (error) throw error;
 
       var pdfFilename = campID + "-" + resultsCamp[0].campaignName + "-CampaignSpecification.pdf";
  //Somnath Task-3618, Get excludedDomain from resultsCamp
        var excludedDomain=" ";
        if(resultsCamp){
          excludedDomain=resultsCamp[0].excludedDomain;
        }
       var sqlQuery = "select supportDocID,suppDocName,leadPerAsset,leadPercentage,typeOfSuppDoc,assetLink,status as assetStatus,multiTouch from supporting_document WHERE campID ='" + campID + "' and (deletedFlag!='" + deleteFlagYesStatus + "' or deletedFlag is null)";
       pool.query(sqlQuery,
         function (error, supportResult, fields) {
           if (error) {
             log.error("Error" + error)
           }
           // else{
 
           var sql = "select * from delivery_format WHERE campID =?";
           pool.query(sql, [campID],
             function (error, results, fields) {
               if (error) {
                 log.error(rrror)
               }
               //else{
               //Somnath Task-3137, Add Extra values in SQL
               var query = "select campID,campaignName,pID,leadInteractionDate,firstName,lastName,companyName,linkedInCompanyName,email,workPhone,workPhoneFormat,jobTitle,linkedInJobTitle,jobLevel,jobFunction,country,address,street,city,state,zipCode,companyEmployeeSize,companyRevenue,industry,ip,supportDocID,assetName,assetNameTouch1,assetTimestampTouch1,assetNameTouch2,assetTimestampTouch2,assetNameTouch3,assetTimestampTouch3,reAllocationID,domain,alternatePhoneNo,comments,linkedIn,extra1,extra2,extra3,extra4,extra5,extra6,extra7,extra8,extra9,extra10,extra11,extra12,extra13,extra14,extra15,extra16,extra17,extra18,extra19,extra20,created,lastUpdated,channel from delivery_format_mapping where deliveryCampID='" + campID + "'";
 
               //query=mysql.escape(query);
               pool.query(query, function (error, deliveryMappingResult, fields) {
                 if (error) {
                   log.error("Error in deliveryFormatMapping=" + error);
                   return res.status(400).json(errors);
                 }
 
                 var pacingQuery = "select * from publisher_pacing WHERE campID ='" + campID + "' and pID='" + pID + "' ORDER BY pacingEndDate asc";
                 pool.query(pacingQuery,
                   function (error, pacingResult, fields) {
                     if (error) {
                       log.error("Pacing Campaign Error" + error)
                     }
 
                     var sqlQuery = "select * from custom_questions WHERE campID ='" + campID + "' order by customQuestionID asc";
                     pool.query(sqlQuery,
                       function (error, questionResult, fields) {
                         if (error) {
                           log.error("Error" + error)
                         }
                         let sqlCountryAl = "select pa.country,pa.lead,pa.status from publisher_countrywise_allocation pa where pa.campID='" + campID + "'and pa.pID='" + pID + "' order by pa.status='Accept' desc";
                         pool.query(sqlCountryAl, (error, countryWiseAllocation, fields) => {
                           if (error) {
                             log.error("Inside publisher/downloadDynamicPDFCampaignDetails");
                           }
                           let sqls = "select * from countrywise_allocation where campID='" + campID + "' and status='New'";
                           pool.query(sqls, (error, countryWiseArray, fields) => {
                             if (error) {
                               log.error("Error publisher/DownloadPDF:" + error);
                               return res.status(400).json(error);
                             }
                             if (countryWiseAllocation.length == 0) {
                               let { allocatedLead, leadAllocation, requiredCountryWiseAllocation } = resultsCamp[0];
                               if (requiredCountryWiseAllocation == "Yes") {
                                 let assign = properties.get('agencyStatus.newAllocation');
 
                                 let lenCountryWiseArray = countryWiseArray.length;
                                 if (lenCountryWiseArray > 0) {
                                   const agencyID = countryWiseArray[0].agencyID;
                                   let newCountry = [];
                                   let count = 0, cnt = 0;
                                   for (let i = 0; i < lenCountryWiseArray; i++) {
                                     let cntry = countryWiseArray[i].country;
                                     let ld = countryWiseArray[i].lead;
                                     let temp = ld * allocatedLead / leadAllocation;
                                     temp = Math.round(temp);
                                     let temp1 = count;
                                     count += temp;
                                     if (count >= allocatedLead) {
                                       let diff = allocatedLead - temp1;
                                       if (diff < 0) { diff = 0; }
                                       temp = diff;
                                     }
                                     if (i == lenCountryWiseArray - 1 && count < allocatedLead) {
                                       temp = allocatedLead - temp1;
                                     }
                                     newCountry.push({ country: cntry, lead: temp });
                                   }
                                   let sumC = newCountry.reduce((tot, a) => {
                                     return tot + a.lead;
                                   }, 0);
                                   let newCountryLen = newCountry.length;
                                   if (sumC > allocatedLead) {
                                     let diff = sumC - allocatedLead;
                                     for (i = newCountryLen - 1; i >= 0; i--) {
                                       let c = 0;
                                       let lead = newCountry[i].lead;
                                       if (lead > diff) {
                                         newCountry[i].lead = lead - diff;
                                         break;
                                       } else if (lead < diff) {
                                         let d = diff - lead;
                                         diff = d
                                         newCountry[i].lead = d;
                                       }
                                     }// End of for loop
                                   }
                                   for (let i = 0; i < newCountry.length; i++) {
                                     newCountry[i].status = 'Assign';
                                     newCountry[i].campID = campID;
                                     newCountry[i].pID = pID;
                                   }
                                   countryWiseAllocation = [];
                                   countryWiseAllocation = [...newCountry]
 
                                 }// End of if countryWiseArray length
                                 // })// End of countrywise_allocation
                               }// End of requiredCountryWiseAllocation is Yes
                             }
                             for (var m = 0; m < pacingResult.length; m++) {
                               if (pacingResult[m].carryLeadCount == null || pacingResult[m].carryLeadCount == undefined || pacingResult[m].carryLeadCount == 'undefined' || pacingResult[m].carryLeadCount == '') {
                                 pacingResult[m].carryLeadCount = 0;
                               }
                               if (pacingResult[m].carryLeadCountNo == null || pacingResult[m].carryLeadCountNo == undefined || pacingResult[m].carryLeadCountNo == 'undefined' || pacingResult[m].carryLeadCountNo == '') {
                                 pacingResult[m].carryLeadCountNo = 0;
                               }
                               if (pacingResult[m].leadCountAllocation == null || pacingResult[m].leadCountAllocation == undefined || pacingResult[m].leadCountAllocation == 'undefined' || pacingResult[m].leadCountAllocation == '') {
                                 pacingResult[m].leadCountAllocation = 0;
                               }
                             }
 
                             var allocatedLead = resultsCamp[0].allocatedLead;
                             var assetFile = [];
                             var abmFile = [];
                             var suppresionFile = [];
                             var suppressionLink = [];
                             var exclusionFile = [];
                             var otherFile = [];
                             var assetLinkArray = [];
                             if (resultsCamp.length > 0) {
                               resultsCamp[0].customJobFunction = unescape(resultsCamp[0].customJobFunction);
                               resultsCamp[0].customJobLevel = unescape(resultsCamp[0].customJobLevel);
                             }
                             let { requiredCountryWiseAllocation } = resultsCamp[0];
                             requiredCountryWiseAllocation = requiredCountryWiseAllocation || " ";
                             // Lead URL
                             var leadDeliveryURL = '';
                             if (results.length > 0) {
                               var parentCampID = resultsCamp[0].parentCampID;
                               var allocationID = resultsCamp[0].reallocationID;
                               var alternatePhoneNo = '', jobTitle = '', jobLevel = '', jobFunction = '', companyRevenue = '', companyEmployeeSize = '', industry = '', assetName = '', assetID = '', assetNameTouch1 = '', assetNameTouch2 = '', assetNameTouch3 = '', assetTimestampTouch1 = '', assetTimestampTouch2 = '', assetTimestampTouch3 = '',street='',extra1 = '', extra2 = '', extra3 = '', extra4 = '', extra5 = '', allocationIDData = '', street = '',extra6='',extra7='',extra8='',extra9='',extra10='',extra11='',extra12='',extra13='',extra14='',extra15='',extra16='',extra17='',extra18='',extra19='',extra20='';
                               if (results[0].street === 'Yes') {//Somnath TAsk:3002,Added street if checked
                                 street = '&street=""';
                               }
                               if (results[0].alternatePhoneNo === 'Yes') {
                                 alternatePhoneNo = '&ALTPH=""';
                               }
                               if (results[0].jobTitle === 'Yes') {
                                 jobTitle = '&jobTitle=""';
                               }
                               if (results[0].jobLevel === 'Yes') {
                                 jobLevel = '&jobLevel=""';
                               }
                               if (results[0].jobFunction === 'Yes') {
                                 jobFunction = '&jobFunction=""';
                               }
                               if (results[0].companyRevenue === 'Yes') {
                                 companyRevenue = '&revenue=""';
                               }
                               if (results[0].companyEmployeeSize === 'Yes') {
                                 companyEmployeeSize = '&companySize=""';
                               }
                               if (results[0].industry === 'Yes') {
                                 industry = '&industry=""';
                               }
                               if (results[0].assetName === 'Yes') {
                                 if (results[0].assetNameTouch1 === 'Yes' || results[0].assetNameTouch2 === 'Yes' || results[0].assetNameTouch3 === 'Yes') { }
                                 else {
                                   assetName = '&assetName=""';
 
                                 }
                               }
                               if (results[0].assetNameTouch1 === 'Yes') {
                                 assetNameTouch1 = '&assetNameTouch1=""';
                               }
                               if (results[0].assetTimestampTouch1 === 'Yes') {
                                 assetTimestampTouch1 = '&assetTimestampTouch1=""';
                               }
                               if (results[0].assetNameTouch2 === 'Yes') {
                                 assetNameTouch2 = '&assetNameTouch2=""';
                               }
                               if (results[0].assetTimestampTouch2 === 'Yes') {
                                 assetTimestampTouch2 = '&assetTimestampTouch2=""';
                               }
                               if (results[0].assetNameTouch3 === 'Yes') {
                                 assetNameTouch3 = '&assetNameTouch3=""';
                               }
                               if (results[0].assetTimestampTouch3 === 'Yes') {
                                 assetTimestampTouch3 = '&assetTimestampTouch3=""';
                               }
                               if (results[0].supportDocID === 'Yes') {
                                 assetID = '&assetID=""';
                               }
                               var linkedIn = '';
                               if (results[0].linkedIn === 'Yes') {
                                 linkedIn = '&linkedIn=""';
                               }
                               var comments = '';
                               if (results[0].comments === 'Yes') {
                                 comments = '&comments=""';
                               }
                               var domain = '';
                               if (results[0].domain === 'Yes') {
                                 domain = '&domain=""';
                               }
                               var ip = '';
                               if (results[0].ip === 'Yes') {
                                 ip = '&ip=""';
                               }
                               if (results[0].extra1 === 'Yes') {
                                 extra1 = '&extra1=""';
                               }
                               if (results[0].extra2 === 'Yes') {
                                 extra2 = '&extra2=""';
                               }
                               if (results[0].extra3 === 'Yes') {
                                 extra3 = '&extra3=""';
                               }
                               if (results[0].extra4 === 'Yes') {
                                 extra4 = '&extra4=""';
                               }
                               if (results[0].extra5 === 'Yes') {
                                 extra5 = '&extra5=""';
                               }
                               //Somnath Task-3137, Add Extra Fields 6-20
                               if (results[0].extra6 === 'Yes') {
                                 extra6 = '&extra6=""';
                               }
                               if (results[0].extra7 === 'Yes') {
                                 extra7 = '&extra7=""';
                               }
                               if (results[0].extra8 === 'Yes') {
                                 extra8 = '&extra8=""';
                               }
                               if (results[0].extra9 === 'Yes') {
                                 extra9 = '&extra9=""';
                               }
                               if (results[0].extra10 === 'Yes') {
                                 extra10 = '&extra10=""';
                               }
                               if (results[0].extra11 === 'Yes') {
                                 extra11 = '&extra11=""';
                               }
                               if (results[0].extra12 === 'Yes') {
                                 extra12 = '&extra12=""';
                               }
                               if (results[0].extra13 === 'Yes') {
                                 extra13 = '&extra13=""';
                               }
                               if (results[0].extra14 === 'Yes') {
                                 extra14 = '&extra14=""';
                               }
                               if (results[0].extra15 === 'Yes') {
                                 extra15 = '&extra15=""';
                               }
                               if (results[0].extra16 === 'Yes') {
                                 extra16 = '&extra16=""';
                               }
                               if (results[0].extra17 === 'Yes') {
                                 extra17 = '&extra17=""';
                               }
                               if (results[0].extra18 === 'Yes') {
                                 extra18 = '&extra18=""';
                               }
                               if (results[0].extra19 === 'Yes') {
                                 extra19 = '&extra19=""';
                               }
                               if (results[0].extra20 === 'Yes') {
                                 extra20 = '&extra20=""';
                               }
 
                               var allocationIDData = '';
                               if (results[0].reAllocationID === 'Yes') {
                                 allocationIDData = '&allocationID=' + allocationID;
                               }
                               var cqURL = '';
                               if (questionResult.length > 0) {
                                 for (var i = 0; i < questionResult.length; i++) {
                                   var cq = '&CQ-' + questionResult[i].customQuestionID + '=""';
                                   cqURL += cq;
                                 }
                               }
                               //Somnath TAsk:3002,Added street in lead delivery URL if checked
                               leadDeliveryURL = 'https://login.demandintegrate.com/leadAPIURL?campID=' + parentCampID + '&pID=' + pID + '&LIDT=MM/DD/YYYY&email=""&fname=""&lname=""&ADD=""&WP=""' + alternatePhoneNo + '&city=""&state=""&zipcode=""&country=""&companyName=""&linkedInCompanyName=""' + jobTitle + '&linkedInJobTitle=""'+street + jobLevel + jobFunction + companyRevenue + companyEmployeeSize + industry + assetName + assetNameTouch1 + assetTimestampTouch1 + assetNameTouch2 + assetTimestampTouch2 + assetNameTouch3 + assetTimestampTouch3 + assetID + allocationIDData + linkedIn + comments + domain + ip + extra1 + extra2 + extra3 + extra4 + extra5+extra6+extra7+extra8+extra9+extra10+extra11+extra12+extra13+extra14+extra15+extra16+extra17+extra18+extra19+extra20 + cqURL;
                             }
 
                             for (var i = 0; i < supportResult.length; i++) {
                               var docType = supportResult[i].typeOfSuppDoc;
                               var assetLink = supportResult[i].assetLink;
                               if (docType === "ABM") {
                                 abmFile.push(supportResult[i].supportDocID + " : " + supportResult[i].suppDocName);
                               }
                               if (docType === "Suppression") {
                                 if (assetLink == '' || assetLink == 'null' || assetLink === null || assetLink == undefined) {
                                   suppresionFile.push(supportResult[i].supportDocID + " : " + supportResult[i].suppDocName);
                                 }
                                 else {
                                   suppressionLink.push({ 'supportDocID': supportResult[i].supportDocID, 'suppDocName': unescape(supportResult[i].suppDocName), 'assetLink': supportResult[i].assetLink })
                                 }
                               }
                               if (docType === "Exclusion") {
                                 exclusionFile.push(supportResult[i].supportDocID + " : " + supportResult[i].suppDocName);
                               }
                               if (docType === "Other") {
                                 otherFile.push(supportResult[i].supportDocID + " : " + supportResult[i].suppDocName);
                               }
                               if (docType === "Asset" && (assetLink == 'null' || assetLink == '' || assetLink == undefined || assetLink == "")) {
                                 var leadPercentage = supportResult[i].leadPercentage;
                                 if (leadPercentage == 'null' || leadPercentage == null || leadPercentage == undefined || leadPercentage == 'undefined' || leadPercentage == "" || leadPercentage == 0) { leadPercentage = '' }
                                 else {
                                   leadPercentage = "(Lead Percentage : " + supportResult[i].leadPercentage + " %)";
                                 }
 
                                 var multiTouch = supportResult[i].multiTouch;
                                 if (multiTouch == 'null' || multiTouch == null || multiTouch == undefined || multiTouch == 'undefined' || multiTouch == "" || multiTouch == 0) { multiTouch = '' }
                                 else {
                                   multiTouch = "(Multi Touch : " + supportResult[i].multiTouch + ")";
                                 }
                                 var leadPerAsset = supportResult[i].leadPerAsset;
                                 if (leadPerAsset == 'null' || leadPerAsset == null || leadPerAsset == undefined || leadPerAsset == 'undefined' || leadPerAsset == "") {
                                   leadPerAsset = '';
                                 }
                                 else {
                                   var allocatedLead = resultsCamp[0].allocatedLead
                                   var leadPerAsset = parseInt(supportResult[i].leadPercentage) * allocatedLead / 100;
                                   leadPerAsset = Math.round(leadPerAsset);
                                   leadPerAsset = "(Leads Per Asset : " + leadPerAsset + " )";
                                 }
                                 if (supportResult[i].assetStatus == undefined || supportResult[i].assetStatus == 'undefined' || supportResult[i].assetStatus == null || supportResult[i].assetStatus == 'null' || supportResult[i].assetStatus == '') {
                                   supportResult[i].assetStatus = 'New'
                                 }
 
                                 assetFile.push({ supportDocID: supportResult[i].supportDocID, leadPercentage: leadPercentage, leadPerAsset: leadPerAsset, suppDocName: unescape(supportResult[i].suppDocName), assetStatus: supportResult[i].assetStatus, multiTouch: multiTouch });
 
                               }
                               if (assetLink !== null) {
                                 if (docType === "Asset" && (assetLink != 'null' || assetLink !== null || assetLink != undefined || assetLink != "")) {
                                   var leadPercentage = supportResult[i].leadPercentage;
                                   if (leadPercentage == 'null' || leadPercentage == null || leadPercentage == undefined || leadPercentage == 'undefined' || leadPercentage == "" || leadPercentage == 0) { leadPercentage = '' }
                                   else {
                                     leadPercentage = "(Lead Percentage : " + supportResult[i].leadPercentage + " %)";
                                   }
 
                                   var multiTouch = supportResult[i].multiTouch;
                                   if (multiTouch == 'null' || multiTouch == null || multiTouch == undefined || multiTouch == 'undefined' || multiTouch == "" || multiTouch == 0) { multiTouch = '' }
                                   else {
                                     multiTouch = "(Multi Touch : " + supportResult[i].multiTouch + " )";
                                   }
 
                                   var leadPerAsset = supportResult[i].leadPerAsset;
                                   if (leadPerAsset == 'null' || leadPerAsset == null || leadPerAsset == undefined || leadPerAsset == 'undefined' || leadPerAsset == "") {
                                     leadPerAsset = '';
                                   }
                                   else {
 
                                     var leadPerAsset = parseInt(supportResult[i].leadPercentage) * allocatedLead / 100;
                                     leadPerAsset = Math.round(leadPerAsset);
                                     leadPerAsset = "(Leads Per Asset : " + leadPerAsset + " )";
                                   }
                                   assetLinkArray.push({ supportDocID: supportResult[i].supportDocID, leadPercentage: leadPercentage, leadPerAsset: leadPerAsset, suppDocName: unescape(supportResult[i].suppDocName), assetLink: supportResult[i].assetLink, assetStatus: supportResult[i].assetStatus, multiTouch: multiTouch });
 
 
 
                                 }
                               }
                             }
                             var employeeSize = resultsCamp[0].employeeSize;
                             if (employeeSize === "" || employeeSize === "null" || employeeSize === "undefined" || employeeSize === null || employeeSize === undefined) {
                               employeeSize = " ";
                             }
 
 
                             var companyRevenue = resultsCamp[0].companyRevenue;
                             if (companyRevenue === "" || companyRevenue === "null" || companyRevenue === "undefined" || companyRevenue === null || companyRevenue === undefined) {
                               companyRevenue = " ";
                             }
 
                             var additionalComments = results[0].additionalComments;
                             if (additionalComments === "" || additionalComments === null || additionalComments === 'null')
                               additionalComments = " ";
 
                             var leadInteractionDays = resultsCamp[0].leadInteractionDays;
                             if (leadInteractionDays == null || leadInteractionDays == undefined || leadInteractionDays == '' || leadInteractionDays == 'undefined') {
                               leadInteractionDays = ' ';
                             }
 
                            //Sonali-3383-added below code for emp size and custom revenue as it was not displayed properly in pdf

                            var employeeSizeWithCustom;
                            if(resultsCamp[0].employeeSize=="" && resultsCamp[0].customEmpSize=="")
                            {
                              employeeSizeWithCustom="Not Applicable";
                            }else{
                               var c_emp_size=resultsCamp[0].customEmpSize;
                               if(c_emp_size){
                                 if (c_emp_size.charAt(0)!== '|') {
                                  c_emp_size="|"+c_emp_size;
                                 }
                               }
                                employeeSizeWithCustom=employeeSize+c_emp_size;
                            }
                            if(employeeSizeWithCustom){
                              if(employeeSizeWithCustom.includes('||')){
                                employeeSizeWithCustom=employeeSizeWithCustom.replace('||','|');
                              }
                            }
                            
                            if(employeeSizeWithCustom===""||employeeSizeWithCustom==="null"||employeeSizeWithCustom==="undefined"||employeeSizeWithCustom===null||employeeSizeWithCustom===undefined || employeeSizeWithCustom=='|')
                                {
                                  employeeSizeWithCustom=" ";
                                }
                                if (employeeSizeWithCustom.charAt(0)=='|'||employeeSizeWithCustom.charAt(0)==" ") {
                                  employeeSizeWithCustom = employeeSizeWithCustom.substr(1);
                                  if(employeeSizeWithCustom.charAt(0)=='|'){
                                    employeeSizeWithCustom = employeeSizeWithCustom.substr(1);

                                  }
                                }
                            var c_comp_revenue=resultsCamp[0].customCompRevenue;
                            if(c_comp_revenue){
                              if (c_comp_revenue.charAt(0)!== '|') {
                               c_comp_revenue="|"+c_comp_revenue;
                              }
                            }

                            var companyRevenueWithCustom=companyRevenue+c_comp_revenue;

                            if(companyRevenueWithCustom){
                              if(companyRevenueWithCustom.includes('||')){
                                companyRevenueWithCustom=companyRevenueWithCustom.replace('||','|');
                              }
                            }
                            
                            if(companyRevenueWithCustom===""||companyRevenueWithCustom==="null"||companyRevenueWithCustom==="undefined"||companyRevenueWithCustom===null||companyRevenueWithCustom===undefined || companyRevenueWithCustom=='|')
                                {
                                  companyRevenueWithCustom=" ";
                                }
                              
                                if (companyRevenueWithCustom.charAt(0)=='|'||companyRevenueWithCustom.charAt(0)==" ") {
                                  companyRevenueWithCustom = companyRevenueWithCustom.substr(1);
                                  if(companyRevenueWithCustom.charAt(0)=='|'){
                                    companyRevenueWithCustom = companyRevenueWithCustom.substr(1);

                                  }
                                }
                                 var jobFun = resultsCamp[0].jobFunction;
                            var c_Job_Fun = resultsCamp[0].customJobFunction;
                            if (c_Job_Fun) {
                              if (c_Job_Fun.charAt(0) !== '|') {
                                c_Job_Fun = "|" + c_Job_Fun;
                              }
                            }
                             var jobFunctionWithCustom = jobFun + c_Job_Fun;
 
                             if (jobFunctionWithCustom.includes('||')) {
                               jobFunctionWithCustom = jobFunctionWithCustom.replace('||').join('|');
                             }
                             if (jobFunctionWithCustom.charAt(0) === '|') {
                               jobFunctionWithCustom = jobFunctionWithCustom.substr(1);
                             }
                             if (jobFunctionWithCustom === "" || jobFunctionWithCustom === "null" || jobFunctionWithCustom === "undefined" || jobFunctionWithCustom === null || jobFunctionWithCustom == '|') {
                               jobFunctionWithCustom = " ";
                             }
                             var clientCampID = resultsCamp[0].clientCampID;
                             if (clientCampID === "" || clientCampID === "null" || clientCampID === "undefined" || clientCampID === undefined || clientCampID === null) {
                               clientCampID = " ";
                             }
 
 
 
                             var noOfLeadPerDomain = resultsCamp[0].noOfLeadPerDomain;
                             if (noOfLeadPerDomain === "" || noOfLeadPerDomain === "null" || noOfLeadPerDomain === undefined || noOfLeadPerDomain === "undefined" || noOfLeadPerDomain === null) {
                               noOfLeadPerDomain = " ";
                             }
                             var jobLevel = resultsCamp[0].jobLevel;
                             if (jobLevel === "" || jobLevel === "null" || jobLevel === "undefined" || jobLevel === undefined || jobLevel === null) {
                               jobLevel = " ";
                             }
                             var firstLeadDeliveryDate = resultsCamp[0].firstLeadDeliveryDate;
                             if (firstLeadDeliveryDate === "" || firstLeadDeliveryDate === "null" || firstLeadDeliveryDate === "undefined" || firstLeadDeliveryDate === undefined || firstLeadDeliveryDate === null) {
                               firstLeadDeliveryDate = " ";
                             }
 
                             var pacingLeadAllocation = resultsCamp[0].pacingLeadAllocation;
                             if (pacingLeadAllocation === "" || pacingLeadAllocation === "null" || pacingLeadAllocation === "undefined" || pacingLeadAllocation === undefined || pacingLeadAllocation === null) {
                               pacingLeadAllocation = " ";
                             }
                             var reAllocationID = results[0].reAllocationID;
                             if (reAllocationID === "" || reAllocationID === "null" || reAllocationID === "undefined" || reAllocationID === undefined || reAllocationID === null) {
                               reAllocationID = " ";
                             }
 
                             var reallocationIDCamp = resultsCamp[0].reallocationID;
                             if (reallocationIDCamp === "" || reallocationIDCamp === "null" || reallocationIDCamp === "undefined" || reallocationIDCamp === undefined || reallocationIDCamp === null) {
                               reallocationIDCamp = " ";
                             }
 
                             var domain = results[0].domain;
                             if (domain === "" || domain === "null" || domain === "undefined" || domain === undefined || domain === null) {
                               domain = " ";
                             }
 
                             var timezone = resultsCamp[0].timezone;
                             if (timezone === "" || timezone === "null" || timezone === "undefined" || timezone === undefined || timezone === null) {
                               timezone = " ";
                             }
 
                             var alternatePhoneNo = results[0].alternatePhoneNo;
                             if (alternatePhoneNo === "" || alternatePhoneNo === "null" || alternatePhoneNo === "undefined" || alternatePhoneNo === undefined || alternatePhoneNo === null) {
                               alternatePhoneNo = " ";
                             }
                             var comments = results[0].comments;
                             if (comments === "" || comments === "null" || comments === "undefined" || comments === undefined || comments === null) {
                               comments = " ";
                             }
                             var linkedIn = results[0].linkedIn;
                             if (linkedIn === "" || linkedIn === "null" || linkedIn === "undefined" || linkedIn === undefined || linkedIn === null) {
                               linkedIn = " ";
                             }
 
                             var channel = results[0].channel;
                             if (channel === "" || channel === "null" || channel === "undefined" || channel === undefined || channel === null) {
                               channel = " ";
                             }
 
 
 
                             var customIndustry = resultsCamp[0].customIndustry;
                             if (customIndustry === "" || customIndustry === "null" || customIndustry === "undefined" || customIndustry === null || customIndustry === undefined) {
                               customIndustry = " ";
                             }
 
                             var industry = resultsCamp[0].industry;
 
                             var industryWithCustomIndustry;
 
                             if (industry == "" && resultsCamp[0].customIndustry == "") {
                               industryWithCustomIndustry = "Not Applicable";
                             } else {
                               if (customIndustry && customIndustry !== ' ') {
                                 if (customIndustry.charAt(0) !== '|') {
                                   customIndustry = "|" + customIndustry;
                                 }
                               }
                               industryWithCustomIndustry = industry + customIndustry;
                             }
 
                             var jobTitleValidation = resultsCamp[0].jobTitleValidation;
                             if (jobTitleValidation === "" || jobTitleValidation === "null" || jobTitleValidation === "undefined" || jobTitleValidation === undefined || jobTitleValidation === null) {
                               jobTitleValidation = " ";
                             }
 
                             var jobLevel = resultsCamp[0].jobLevel;
                             var jobCustom = resultsCamp[0].customJobLevel;
                             if (jobLevel === "" || jobLevel === "null" || jobLevel === "undefined" || jobLevel === null || jobLevelAndCustom === undefined) {
                               jobLevel = " ";
                             }
                             if (jobCustom === "" || jobCustom === "null" || jobCustom === "undefined" || jobCustom === null || jobLevelAndCustom === undefined) {
                               jobCustom = " ";
                             }
                             var jobLevelAndCustom = jobLevel + jobCustom;
 
                             var otherSpecs = resultsCamp[0].otherSpecs;
                             otherSpecs = unescape(otherSpecs)
 
                             if (otherSpecs === "" || otherSpecs === "null" || otherSpecs === "undefined" || otherSpecs === undefined || otherSpecs === null) {
                               otherSpecs = " ";
                             } else if (otherSpecs.includes("	")) {
                               otherSpecs = "\n" + otherSpecs.split("	").join(" ");
                             } else if (otherSpecs.includes("\n")) {
                               otherSpecs = "\n" + otherSpecs;
                             }
 
                             var jobTitle = resultsCamp[0].jobTitle;
                             if (jobTitle.includes("	")) {
                               jobTitle = "\n" + jobTitle.split("	").join(" ");
                             } else if (jobTitle.includes("\n")) {
                               jobTitle = "\n" + jobTitle;
                             }
                             var parentCampID;
                             if (resultsCamp[0].parentCampID == undefined || resultsCamp[0].parentCampID == null || resultsCamp[0].parentCampID == '') {
                               parentCampID = campID;
                             }
                             else {
                               parentCampID = resultsCamp[0].parentCampID;
                             }
 
                             var callAudit;
                             if (resultsCamp[0].callAudit == undefined || resultsCamp[0].callAudit == null || resultsCamp[0].callAudit == '') {
                               callAudit = '';
                             }
                             else {
                               callAudit = resultsCamp[0].callAudit;
                             }
 
                             var jobLevel = resultsCamp[0].jobLevel;
                             var jobCustom = resultsCamp[0].customJobLevel;
                             if (jobLevel === "" || jobLevel === "null" || jobLevel === "undefined" || jobLevel === null || jobLevel === undefined) {
                               jobLevel = " ";
                             }
                             if (jobCustom === "" || jobCustom === "null" || jobCustom === "undefined" || jobCustom === null || jobCustom === undefined) {
                               jobCustom = " ";
                             }
                             if (jobCustom) {
                               if (jobCustom.charAt(0) !== '|') {
                                 jobCustom = "|" + jobCustom;
                               }
                             }
 
                             var jobLevelAndCustom = jobLevel + jobCustom;
                             if (jobLevelAndCustom.includes('||')) {
                               jobLevelAndCustom = jobLevelAndCustom.replace('||').join('|');
                             }
                             if (jobLevelAndCustom) {
                               jobLevelAndCustom = jobLevelAndCustom.trim();
                             }
                             if (jobLevelAndCustom.charAt(0) === '|') {
                               jobLevelAndCustom = jobLevelAndCustom.substr(1);
                             }
                             if (jobLevelAndCustom === "" || jobLevelAndCustom === "null" || jobLevelAndCustom === "undefined" || jobLevelAndCustom === null || jobLevelAndCustom === undefined || jobLevelAndCustom == '|') {
                               jobLevelAndCustom = " ";
                             }
 
                             var callAudit = resultsCamp[0].callAudit;
 
                             if (callAudit === "" || callAudit === "null" || callAudit === "undefined" || callAudit === undefined || callAudit === null) {
                               callAudit = " "
                             }
 
                             // Create a document
                             const doc = new PDFDocumentCreate;
 
 
                             // pip the document to write
                             // var pdfWriteStream=fs.createWriteStream('D:/'+pdfFilename);
                             // doc.pipe(pdfWriteStream);
 
                             // Embed a font, set the font size, and render some text
                             doc.font('Times-Bold')
                               .fontSize(25)
 
                               .fillColor("green")
                               .text('Campaign ID : ' + parentCampID, {
                                 underline: true,
                                 align: 'center'
                               })
                               .moveDown(0.3)
 
                             doc.font('Times-Bold')
                               .fontSize(18)
 
                               .fillColor("green")
                               .text('Allocation ID : ' + reallocationIDCamp, {
                                 underline: true,
                                 align: 'center'
                               })
                               .moveDown(0.3)
 
 
                             doc.fontSize(12)
 
                               .fillColor("orange")
                               .text('Basic Details:', { underline: true })
                               .moveDown(0.5)
                               .fillColor("black")
                               .text('Campaign Name : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               // .text(campaignName)
                               .text(resultsCamp[0].campaignName)
 
                               .fillColor("black")
                               .text('Agency Campaign ID : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(clientCampID)
 
                               // .fillColor("black")
                               //  .text('Insertion Order : ', {
                               //   width: 465,
                               //   continued: true
                               // }).fillColor('blue')
                               // .text(resultsCamp[0].insertionOrder)
 
                               .fillColor("black")
                               .text('Campaign Status : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].campaignStatus)
 
                               .fillColor("black")
                               .text('Start Date : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].startDate)
 
                               .fillColor("black")
                               .text('End Date : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].endDate)
 
                               .fillColor("black")
                               .text('First Lead Delivery Date : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(firstLeadDeliveryDate)
 
                               .fillColor("black")
                               .text('Lead Interaction Days : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(leadInteractionDays)
 
                               .fillColor("black")
                               .text('Time Zone : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(timezone)
 
                               .fillColor("black")
                               .text('Lead Allocation : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].allocatedLead)
 
                               .fillColor("black")
                               .text('No. of Lead per domain : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(noOfLeadPerDomain)
 
                             // .fillColor("black")
                             //  .text('Created By : ' , {
                             //   width: 465,
                             //   continued: true
                             // }).fillColor('blue')
                             // .text(resultsCamp[0].createdByCompanyName)
 
                             if (pacingResult.length > 0) {
 
                               doc.moveDown(2.0)
                                 .fillColor("orange")
                                 .text('Pacing Details:', { underline: true })
                                 .moveDown(0.5)
                                 .text('')
                                 .fillColor("black")
                                 .text('Pacing Unit : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(pacingResult[0].pacingUnit)
 
 
                               // var pacingResultTable=[];
 
                               // doc.fillColor("black")
                               // .font('Times-Bold')
                               // doc.text(pacingResult[0].pacingMonth+' : '+pacingResult[0].pacingUnit+' : '+pacingPercentage+' : '+pacingResult[0].pacingLeadCount+' : '+pacingResult[0].pacingEndDate+' : '+pacingResult[0].pacingCarryForward).fillColor("black")
 
                               // for(var g=0;g<pacingResult.length;g++)
                               // {
                               // var pacingPercentage=parseInt(pacingResult[g].pacingPercentage)*parseInt(allocatedLead)/100;
                               // pacingPercentage=pacingPercentage;
                               //   var pacingLeadCount=parseInt(pacingResult[g].pacingPercentage)*parseInt(allocatedLead)/100;
                               //  // pacingResult[g].pacingPercentage=pacingPercentage;
 
 
                               //   pacingResult[g].pacingLeadCount=Math.round(pacingLeadCount);
 
                               //   pacingResultTable.push({pacingMonth:pacingResult[g].pacingMonth,pacingPercentage:pacingResult[g].pacingPercentage,pacingLeadCount:pacingResult[g].pacingLeadCount,pacingEndDate:pacingResult[g].pacingEndDate,pacingCarryForward:pacingResult[g].pacingCarryForward})
 
                               // pacingResultTable.push({pacingMonth:pacingResult[g].pacingMonth,pacingPercentage:pacingResult[g].pacingPercentage,pacingLeadCount:pacingResult[g].pacingLeadCount})
 
                               //   }
 
 
                               table = new PdfTable(doc, {
                                 bottomMargin: 50
                               });
 
                               table
                                 // add some plugins (here, a 'fit-to-width' for a column)
                                 .addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
                                   column: 'pacingMonth'
                                 }))
                                 // set defaults to your columns
 
                                 .setColumnsDefaults({
                                   headerBorder: ['L', 'T', 'B', 'R'],
                                   border: ['L', 'T', 'B', 'R'],
                                   align: 'center',
                                   headerPadding: [5, 5, 5, 5],
 
                                 })
 
                                 // add table columns
 
                                 .addColumns([
                                   {
                                     id: 'pacingMonth',
                                     header: 'Month',
                                     padding: [5, 5, 5, 5],
                                     width: 80,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.pacingMonth
                                     }
 
                                   },
                                   {
                                     id: 'pacingPercentage',
                                     header: '%',
                                     padding: [5, 5, 5, 5],
                                     width: 40,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return (data.pacingPercentage + '%')
                                     }
 
                                   },
                                   {
                                     id: 'pacingLeadCount',
                                     header: 'Lead Count',
                                     padding: [5, 5, 5, 5],
                                     width: 40,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.pacingLeadCount
                                     }
 
                                   },
                                   {
                                     id: 'pacingEndDate',
                                     header: 'End Date',
                                     padding: [5, 5, 5, 5],
                                     width: 80,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.pacingEndDate
                                     }
 
                                   },
                                   {
                                     id: 'pacingCarryForward',
                                     header: 'Carry Forward',
                                     padding: [5, 5, 5, 5],
                                     width: 60,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.pacingCarryForward
                                     }
                                   }, {
                                     id: 'carryLeadCount',
                                     header: 'Carry Forward Leads (Yes)',
                                     padding: [5, 5, 5, 5],
                                     width: 60,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.carryLeadCount
                                     }
 
                                   },
                                   {
                                     id: 'carryLeadCountNo',
                                     header: 'Carry Forward Leads (No)',
                                     padding: [5, 5, 5, 5],
                                     width: 60,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.carryLeadCountNo
                                     }
 
                                   },
                                   {
                                     id: 'leadCountAllocation',
                                     header: 'Extra Leads Delivered',
                                     padding: [5, 5, 5, 5],
                                     width: 60,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.leadCountAllocation
                                     }
 
                                   },
 
                                 ])
                                 // add events (here, we draw headers on each new page)
                                 .onPageAdded(function (tb) {
                                   // tb.addHeader();
                                   table.pdf.fillColor('blue');
                                 });
 
                               table.addBody(pacingResult);
 
 
                               doc.moveDown(0.9)
                             }
 
                             doc.font('Times-Bold')
                               .fontSize(12)
                               .text('', 70, doc.y)
                               .moveDown(2.0)
                               .fillColor("orange")
                               .text('Delivery Option:', { underline: true })
                               .moveDown(0.5)
                               //.underline(100, 100, 160, 27, {color: "#0000FF"})
                               .text('')
                               .fillColor("black")
                               .text('Pacing : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].pacing)
 
                               //Sonali-3229-commenting below code as per the changes suggested by Pranali
                               // .fillColor("black")
                               // .text('Pacing Lead Allocation : ', {
                               //   width: 465,
                               //   continued: true
                               // }).fillColor('blue')
                               // .text(pacingLeadAllocation)
 
                               .fillColor("black")
                               .text('Marketing Channel : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].marketingChannel)
 
                               .fillColor("black")
                               .text('Call Audit : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(callAudit)
 
                               .fillColor("black")
                               .text('Campaign Reporting Day : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].campaignReportingDay)
 
                               .fillColor("black")
                               .text('Lead Delivery Option : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].leadDeliveryOption)
 
                             // .fillColor("black")
                             // .text('Required LP Approval : ', {
                             //   width: 465,
                             //   continued: true
                             // }).fillColor('blue')
                             // .text(resultsCamp[0].requiredLPApproval)
 
                             // if(resultsCamp[0].requiredLPApproval=='Yes'){
 
                             //   doc.fillColor("black")
                             //   .text('LP Approval Timeline : ', {
                             //     width: 465,
                             //     continued: true
                             //   }).fillColor('blue')
                             //   .text(resultsCamp[0].lpTimeline)
                             // }
 
 
 
 
                             var requiredLPApproval = resultsCamp[0].requiredLPApproval;
                             if (requiredLPApproval === '' || requiredLPApproval === null || requiredLPApproval === undefined) {
 
                             } else {
                               if (requiredLPApproval[0] == ',') {
                                 requiredLPApproval = requiredLPApproval.slice(1)
                               }
                               doc.fillColor("black")
                                 .text('Creative Approval : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(requiredLPApproval)
                             }
 
                             if (resultsCamp[0].requiredLPApproval === '' || requiredLPApproval === null || requiredLPApproval === undefined) {
                               doc.fillColor("black")
                                 .text('Creative Approval : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(requiredLPApproval)
                             }
 
                             if (resultsCamp[0].requiredLPApproval == '') {
                               doc
                                 .fillColor("black")
                                 .text('Creative Approval : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text('No')
                             }
                             else {
 
                               doc.fillColor("black")
                                 .text('Creative Approval Timeline (Hours): ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(resultsCamp[0].lpTimeline)
                             }
                             if (resultsCamp[0].requiredLPApproval == '') { }
                             else {
                               doc.fillColor("black")
                                 .text('Creative Approval Required For: ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(resultsCamp[0].creativeApprovalRequiredFor)
                             }
                             doc.moveDown(1.0)
                             //Sonali-Task 3189-Added subcontracting in the pdf
                             if(resultsCamp[0].subContracting==='' || resultsCamp[0].subContracting===null || resultsCamp[0].subContracting===undefined){
                               doc.fillColor("black")
                               .text('Sub-Contracting : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text('')
 
                             }
                             else{
                               //doc.text('')
                               doc.fillColor("black")
                               .text('Sub-Contracting : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].subContracting)
                             }
 
                             // doc.fontSize(10)
                             doc.moveDown(2.0)
                               .fillColor("orange")
                               .text('Campaign Specification:', { underline: true })
                               .moveDown(0.5)
                               //.underline(100, 100, 160, 27, {color: "#0000FF"})
                               .fillColor("black")
                               .text('Region :', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].region)
 
                               .fillColor("black")
                               .text('Country : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].country)
 
                                //Sonali-3793-added biddingType and countrywiseLeadAllocation condition

                                if(resultsCamp[0].countrywiseLeadAllocation=="Yes" && resultsCamp[0].biddingType=="Geowise"){}
                                else{
                               doc.fillColor("black")
                               .text('Lead Allocation by country : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(requiredCountryWiseAllocation)
                               }
 
                             if (resultsCamp[0].state == "Yes") {
 
                               doc.fillColor("black")
                                 .text('State : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(resultsCamp[0].stateFileName)
                             }
 
                             if (resultsCamp[0].city == "Yes") {
 
                               doc.fillColor("black")
                                 .text('City : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(resultsCamp[0].cityFileName)
                             }
                             if (resultsCamp[0].zipCode == "Yes") {
 
                               doc.fillColor("black")
                                 .text('Zip Code : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(resultsCamp[0].zipCodeFileName)
                             }
                             
                            //  Somnath Task-3604, Add excludedIndustryFileName
                             if(resultsCamp[0].excludedIndustryFlag=="Yes"){
                              doc.fillColor("black")
                              .text('Industry Exclusion: ', {
                                width: 465,
                                continued: true
                              }).fillColor('blue')
                              .text(resultsCamp[0].excludedIndustryFileName || " ")
                            }
 
                             doc.fillColor("black")
                               .text('Campaign Type : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(resultsCamp[0].ABM)
 
                               .fillColor("black")
                               .text('Job Level : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(jobLevelAndCustom)
 
                               .fillColor("black")
                               .text('Job Function : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(jobFunctionWithCustom)
 
                               .fillColor("black")
                               .text('Industry : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(industryWithCustomIndustry)
 
                               .fillColor("black")
                               .text('Employee Size : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(employeeSizeWithCustom)
 
                               .fillColor("black")
                               .text('Company Revenue : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(companyRevenueWithCustom)
 
                             doc.text(' ')
                               .fillColor("black")
                               .text('Job Title : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(jobTitle)
 
                               .fillColor("black")
                               .text('Other Specs : ', {
                                 continued: true
                               }).fillColor('blue')
                               .text(otherSpecs)
 
                               //Sonali-3793-added biddingType and countrywiseLeadAllocation condition

                             /** Countrywise Allocation **/
                             if (requiredCountryWiseAllocation == 'Yes') {
                              if(resultsCamp[0].countrywiseLeadAllocation=="Yes" && resultsCamp[0].biddingType=="Geowise"){}
                              else{
                               if (countryWiseAllocation.length > 0) {
                                 doc
                                   .text('', 70, doc.y + 10);
                                 doc.moveDown(2.0)
                                   .text(' ')
                                   .fillColor("orange")
                                   .text('Country Wise Lead Allocation', { underline: true })
                                   .moveDown(1.0)
                                   .fillColor("black")
 
                                 doc
                                   .font('Times-Bold')
                                   .fillColor("blue")
                                   .fontSize(12)
                                   .text('');
                                 table3 = new PdfTable(doc, {});
                                 doc.fontSize(12);
 
                                 table3.addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
                                   column: 'description111',
                                   align: 'left',
                                 }))
                                   // set defaults to your columns
 
                                   .setColumnsDefaults({
                                     headerBorder: ['L', 'T', 'B', 'R'],
                                     border: ['L', 'T', 'B', 'R'],
                                     align: 'left',
                                     headerPadding: [5, 5, 5, 5],
                                   })
 
                                   .addColumns([
                                     {
                                       id: 'country',
                                       header: 'Country Name',
                                       align: 'center',
                                       padding: [5, 5, 5, 5],
                                       width: 130,
                                       cache: false,
                                       renderer: function (tb, data) {
                                         if (data.status == 'Removed') {
                                           tb.pdf.fillColor('red');
                                           tb.pdf.font('Times-Roman'); return data.country
                                         } else {
                                           tb.pdf.fillColor('black');
                                           tb.pdf.font('Times-Roman'); return data.country
                                         }
                                       }
                                     },
                                     {
                                       id: 'lead',
                                       header: 'Total Lead',
                                       align: 'center',
                                       padding: [5, 5, 5, 5],
                                       width: 100,
                                     },
                                     {
                                       id: 'status',
                                       header: 'Status',
                                       align: 'center',
                                       padding: [5, 5, 5, 5],
                                       width: 100,
                                     }
                                   ])
                                   .onPageAdded(function (tb) {
                                     table3.pdf.fillColor('black');
                                   });
                                 // draw content, by passing data to the addBody method
                                 table3.addBody(countryWiseAllocation);// for getting only one Row
                               }
                               doc
                                 .fontSize(12)
                                 .text('', 70);
                             }
                            }
 
                             doc.moveDown(2.0)
                               .fillColor("orange")
                               .text('Supporting Document:', { underline: true })
                               .moveDown(0.5)
                               //.underline(100, 100, 160, 27, {color: "#0000FF"})
                               .fillColor("black")
                               .text('ABM :', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .moveDown(0.9)
                               .list([abmFile], { bulletIndent: 20, textIndent: 20 })
 
 
                               .text(' ')
                               .fillColor("black")
                               .text('Suppression : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .moveDown(0.9)
                               .list([suppresionFile], { bulletIndent: 20, textIndent: 20 })
 
                             //    if(suppressionLink.length>0){
                             //     doc.text(' ')
                             //     .moveDown(1.0)
                             //     .fillColor("orange")
                             //  .text('Suppression Link:',{underline :true})
                             //  .moveDown(0.9)
                             //     //.underline(100, 100, 160, 27, {color: "#0000FF"})
                             //     .fillColor("black")
                             //     for(var i=0;i<suppressionLink.length;i++){
                             //       doc.fillColor("black")
                             //       .font('Times-Bold')
                             //         doc.text(suppressionLink[i].supportDocID+' : '+suppressionLink[i].suppDocName).fillColor("blue").text(suppressionLink[i].assetLink,{bulletIndent:20, textIndent:20}).fillColor("black")
                             //       doc.moveDown(0.9)
                             //     }  
                             //    }
                             doc.text(' ')
                               .fillColor("black")
                               .text('Exclusion : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .moveDown(0.9)
                               .list([exclusionFile], { bulletIndent: 20, textIndent: 20 })
 
                               //Somnath Task-3618, Add excluded Domain in pdf file 
                            doc.text(' ')
                            .fillColor("black")
                            .text('Exclude Domain Extension: ', {
                              width: 465,
                              continued: true
                            }).fillColor('blue')
                            .text(excludedDomain)

                               .text(' ')
                               .fillColor("black")
                               .text('Other : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .moveDown(0.9)
                               .list([otherFile], { bulletIndent: 20, textIndent: 20 })
 
                               .text(' ')
                               .moveDown(1.0)
                               .fillColor("orange")
                             doc.font('Times-Bold')
                               .text('Assets:', { underline: true })
                               .moveDown(0.9)
                               //.underline(100, 100, 160, 27, {color: "#0000FF"})
                               .fillColor("black")
 
                             //.list([assetFile],{bulletIndent:20, textIndent:20})
                             for (var i = 0; i < assetFile.length; i++) {
                               doc.fillColor("black")
                                 .font('Times-Bold')
                               // if(assetFile[i].assetStatus=='Removed'){
                               //     if(resultsCamp[0].requiredLeadPerAsset=='Yes'){
                               //        doc.text().fillColor("black")
                               // let textdata=assetFile[i].supportDocID+' : '+assetFile[i].leadPercentage+' : '+assetFile[i].leadPerAsset+' : '+assetFile[i].suppDocName;
                               // doc.fillColor("red").text(textdata,{bulletIndent:20, textIndent:20,strike:true})
                               //     }else{
                               //       let textdata=assetFile[i].supportDocID+' : '+assetFile[i].suppDocName;
                               //       doc.fillColor("red").text(textdata,{bulletIndent:20, textIndent:20,strike:true})
                               //     }
                               // }else{
                               //               if(resultsCamp[0].requiredLeadPerAsset=='Yes'){
                               //                 doc.text(assetFile[i].supportDocID+' : '+assetFile[i].leadPercentage+' : '+assetFile[i].leadPerAsset+' : '+assetFile[i].suppDocName).fillColor("black")
                               //                   }else{
                               //                     doc.text(assetFile[i].supportDocID+' : '+assetFile[i].suppDocName).fillColor("black")
                               //                   }
                               // }
                               if (assetFile[i].assetStatus == 'Removed') {
 
                                 if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'No') {
                                   doc.text();
                                   doc.fillColor("red").text(assetFile[i].supportDocID + ' : ' + assetFile[i].leadPercentage + ' : ' + assetFile[i].leadPerAsset + ' : ' + assetFile[i].suppDocName, { bulletIndent: 20, textIndent: 20, strike: true })
                                 }
                                 else if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'Yes') {
 
                                   doc.text();
                                   doc.fillColor("red").text(assetFile[i].supportDocID + ' : ' + assetFile[i].leadPercentage + ' : ' + assetFile[i].leadPerAsset + ' : ' + assetFile[i].multiTouch + ' : ' + assetFile[i].suppDocName, { bulletIndent: 20, textIndent: 20, strike: true })
 
                                 }
                                 else if (resultsCamp[0].requiredLeadPerAsset == 'No' && resultsCamp[0].multiTouch == 'Yes') {
 
                                   doc.text();
                                   doc.fillColor("red").text(assetFile[i].supportDocID + ' : ' + assetFile[i].multiTouch + ' : ' + assetFile[i].suppDocName, { bulletIndent: 20, textIndent: 20, strike: true })
 
                                 }
                                 else {
 
                                   doc.fillColor("red").text(assetFile[i].supportDocID + ' : ' + assetFile[i].suppDocName, { bulletIndent: 20, textIndent: 20, strike: true })
                                 }
 
 
                               } else {
                                 if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'No') {
                                   doc.text(assetFile[i].supportDocID + ' : ' + assetFile[i].leadPercentage + ' : ' + assetFile[i].leadPerAsset + ' : ' + assetFile[i].suppDocName).fillColor("black")
                                 }
                                 else if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'Yes') {
 
                                   doc.text(assetFile[i].supportDocID + ' : ' + assetFile[i].leadPercentage + ' : ' + assetFile[i].leadPerAsset + ' : ' + assetFile[i].multiTouch + ' : ' + assetFile[i].suppDocName).fillColor("black")
 
                                 }
                                 else if (resultsCamp[0].requiredLeadPerAsset == 'No' && resultsCamp[0].multiTouch == 'Yes') {
 
                                   doc.text(assetFile[i].supportDocID + ' : ' + assetFile[i].multiTouch + ' : ' + assetFile[i].suppDocName).fillColor("black")
 
                                 }
                                 else {
 
                                   doc.text(assetFile[i].supportDocID + ' : ' + assetFile[i].suppDocName).fillColor("black")
 
                                 }
                               }
                               doc.moveDown(0.9)
                             }
                             if (assetLinkArray.length > 0) {
                               doc.text(' ')
                                 .moveDown(1.0)
                                 .fillColor("orange")
                                 .text('Assets Link:', { underline: true })
                                 .moveDown(0.9)
                               //.underline(100, 100, 160, 27, {color: "#0000FF"})
                               for (var i = 0; i < assetLinkArray.length; i++) {
                                 doc.fillColor("black")
                                   .font('Times-Bold')
                                 // if(assetLinkArray[i].assetStatus=='Removed'){
                                 //   if(resultsCamp[0].requiredLeadPerAsset=='Yes'){
                                 // let textdata=assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].leadPercentage+' : '+assetLinkArray[i].leadPerAsset+' : '+assetLinkArray[i].suppDocName+' : '+assetLinkArray[i].assetLink;
                                 // doc.fillColor("red").text(textdata,{bulletIndent:20, textIndent:20,strike:true})
                                 //    }else{
                                 //   let textdata=assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].suppDocName+' : '+assetLinkArray[i].assetLink;
                                 //   doc.fillColor("red").text(textdata,{bulletIndent:20, textIndent:20,strike:true})
                                 //    }
 
                                 // }else{
                                 //                                      if(resultsCamp[0].requiredLeadPerAsset=='Yes'){
                                 //                                       doc.text(assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].leadPercentage+' : '+assetLinkArray[i].leadPerAsset+' : '+assetLinkArray[i].suppDocName).fillColor("blue").text(assetLinkArray[i].assetLink,{bulletIndent:20, textIndent:20}).fillColor("black")
                                 //                                      }else{
                                 //                                       doc.text(assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].suppDocName).fillColor("blue").text(assetLinkArray[i].assetLink,{bulletIndent:20, textIndent:20}).fillColor("black")
                                 //                                      } ////
                                 //                                     }
                                 if (assetLinkArray[i].assetStatus == 'Removed') {
                                   if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'No') {
 
                                     let textdata = assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].leadPercentage + ' : ' + assetLinkArray[i].leadPerAsset + ' : ' + assetLinkArray[i].suppDocName + ' : ' + assetLinkArray[i].assetLink;
                                     doc.fillColor("red").text(textdata, { bulletIndent: 20, textIndent: 20, strike: true })
 
                                   }
 
                                   else if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'Yes') {
 
                                     let textdata = assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].leadPercentage + ' : ' + assetLinkArray[i].leadPerAsset + ' : ' + assetLinkArray[i].multiTouch + ' : ' + assetLinkArray[i].suppDocName + ' : ' + assetLinkArray[i].assetLink;
                                     doc.fillColor("red").text(textdata, { bulletIndent: 20, textIndent: 20, strike: true })
                                   }
 
                                   else if (resultsCamp[0].requiredLeadPerAsset == 'No' && resultsCamp[0].multiTouch == 'Yes') {
 
                                     let textdata = assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].multiTouch + ' : ' + assetLinkArray[i].suppDocName + ' : ' + assetLinkArray[i].assetLink;
                                     doc.fillColor("red").text(textdata, { bulletIndent: 20, textIndent: 20, strike: true })
                                   }
 
                                   else {
 
                                     let textdata = assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].suppDocName + ' : ' + assetLinkArray[i].assetLink;
                                     doc.fillColor("red").text(textdata, { bulletIndent: 20, textIndent: 20, strike: true })
                                   }
 
 
                                   //                                         if(resultsCamp[0].requiredLeadPerAsset=='Yes'){
                                   // let textdata=assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].leadPercentage+' : '+assetLinkArray[i].leadPerAsset+' : '+assetLinkArray[i].suppDocName+' : '+assetLinkArray[i].assetLink;
                                   //                                           doc.fillColor("red").text(textdata,{bulletIndent:20, textIndent:20,strike:true})
                                   //                                           }else{
                                   // let textdata=assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].suppDocName+' : '+assetLinkArray[i].assetLink;
                                   // doc.fillColor("red").text(textdata,{bulletIndent:20, textIndent:20,strike:true})
                                   //                                         } 
                                 } else {
 
                                   if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'No') {
                                     doc.text(assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].leadPercentage + ' : ' + assetLinkArray[i].leadPerAsset + ' : ' + assetLinkArray[i].suppDocName).fillColor("blue").text(assetLinkArray[i].assetLink, { bulletIndent: 20, textIndent: 20 }).fillColor("black")
 
                                   }
                                   else if (resultsCamp[0].requiredLeadPerAsset == 'No' && resultsCamp[0].multiTouch == 'Yes') {
 
                                     doc.text(assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].suppDocName + ' : ' + assetLinkArray[i].multiTouch).fillColor("blue").text(assetLinkArray[i].assetLink, { bulletIndent: 20, textIndent: 20 }).fillColor("black")
 
                                   }
                                   else if (resultsCamp[0].requiredLeadPerAsset == 'Yes' && resultsCamp[0].multiTouch == 'Yes') {
 
                                     doc.text(assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].leadPercentage + ' : ' + assetLinkArray[i].leadPerAsset + ' : ' + assetLinkArray[i].multiTouch + ' : ' + assetLinkArray[i].suppDocName).fillColor("blue").text(assetLinkArray[i].assetLink, { bulletIndent: 20, textIndent: 20 }).fillColor("black")
 
                                   }
                                   else {
 
                                     doc.text(assetLinkArray[i].supportDocID + ' : ' + assetLinkArray[i].suppDocName).fillColor("blue").text(assetLinkArray[i].assetLink, { bulletIndent: 20, textIndent: 20 }).fillColor("black")
 
                                   }
                                   // if(resultsCamp[0].requiredLeadPerAsset=='Yes'){
                                   //   doc.text(assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].leadPercentage+' : '+assetLinkArray[i].leadPerAsset+' : '+assetLinkArray[i].suppDocName).fillColor("blue").text(assetLinkArray[i].assetLink,{bulletIndent:20, textIndent:20}).fillColor("black")
                                   //  }else{
                                   //   doc.text(assetLinkArray[i].supportDocID+' : '+assetLinkArray[i].suppDocName).fillColor("blue").text(assetLinkArray[i].assetLink,{bulletIndent:20, textIndent:20}).fillColor("black")
                                   // } 
                                 }
                                 doc.moveDown(0.9)
                               }
                             }
 
 
 
 
                             doc.moveDown(2.0)
                               .fillColor("orange")
                               .text('Lead Delivery Through API:', { underline: true })
                               .moveDown(0.5)
                               .fillColor("black")
                               .font('Times-Bold')
                               .text('URL : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(leadDeliveryURL)
 
                             doc.moveDown(2.0)
                               .fillColor("orange")
                               .text('Delivery Format:', { underline: true })
                               .moveDown(0.5)
                               .fillColor("black")
                               .font('Times-Bold')
                               .text('Publisher ID : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].pID)
 
                               .fillColor("black")
 
                               .text('Campaign ID : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].campaignID)
 
                               .fillColor("black")
                               .text('Campaign Name : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].campaignName)
 
                               .fillColor("black")
                               .text('Allocation ID : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(reAllocationID)
 
 
                               .fillColor("black")
                               .text('Lead Interaction Date : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].leadInteractionDate)
 
                               .fillColor("black")
                               .text('First Name: ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].firstName)
 
                               .fillColor("black")
                               .text('Last Name: ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].lastName)
 
 
                               .fillColor("black")
                               .text('Email : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].email)
                               .fillColor("black")
                               .text('Company Name : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].companyName)
 
                               .fillColor("black")
                               .text('Linkedin Company Name : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].linkedInCompanyName)
 
                               .fillColor("black")
                               .text('Work Phone : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].workPhone)
 
                               .fillColor("black")
                               .text('Job Title : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].jobTitle)
                               .fillColor("black")
                               .text('Linkedin Job Title : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].linkedInJobTitle)
 
                               .fillColor("black")
                               .text('Job Title Validation : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(jobTitleValidation)
 
                               .fillColor("black")
                               .text('Job Level : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].jobLevel)
 
                               .fillColor("black")
                               .text('Job Function : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].jobFunction)
 
                               .fillColor("black")
                               .text('Address : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].address)
 
                               .fillColor("black")
                               .text('Country : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].country)
 
                               .fillColor("black")//Somnath Task:3002,Added street if checked
                               .text('Street : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].street)
 
                               .fillColor("black")
                               .text('City : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].city)
 
                               .fillColor("black")
                               .text('State : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].state)
 
                               .fillColor("black")
                               .text('Zip Code : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].zipCode)
 
                               .fillColor("black")
                               .text('Company Employee Size : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].companyEmployeeSize)
 
                               .fillColor("black")
                               .text('Company Revenue : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].companyRevenue)
 
                               .fillColor("black")
                               .text('IP : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].ip)
 
                               .fillColor("black")
                               .text('Industry : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].industry)
 
                               .fillColor("black")
                               .text('Asset ID : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].supportDocID)
 
                             if (results[0].assetNameTouch1 == "Yes") {
                               doc.fillColor("black")
                                 .text('Asset Name : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text("No")
                             }
                             else {
                               doc.fillColor("black")
                                 .text('Asset Name : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(results[0].assetName)
                             }
 
                             doc.fillColor("black")
                               .text('Asset Name Touch 1 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].assetNameTouch1)
 
                               .fillColor("black")
                               .text('Asset Name Touch 2 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].assetNameTouch2)
 
                               .fillColor("black")
                               .text('Asset Name Touch 3 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].assetNameTouch3)
 
 
                             doc.fillColor("black")
                               .text('Extra 1 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra1)
 
                               .fillColor("black")
                               .text('Extra 2 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra2)
 
                               .fillColor("black")
                               .text('Extra 3 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra3)
 
                               .fillColor("black")
                               .text('Extra 4 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra4)
 
                               .fillColor("black")
                               .text('Extra 5 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra5)
 
                               //Somnath Task-3137, Add extra Values 6-20
                               .fillColor("black")
                               .text('Extra 6 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra6)
 
                               .fillColor("black")
                               .text('Extra 7 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra7)
 
                               .fillColor("black")
                               .text('Extra 8 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra8)
 
                               .fillColor("black")
                               .text('Extra 9 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra9)
 
                               .fillColor("black")
                               .text('Extra 10 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra10)
 
                               .fillColor("black")
                               .text('Extra 11 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra11)
 
                               .fillColor("black")
                               .text('Extra 12 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra12)
 
                               .fillColor("black")
                               .text('Extra 13 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra13)
 
                               .fillColor("black")
                               .text('Extra 14 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra14)
 
                               .fillColor("black")
                               .text('Extra 15 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra15)
 
                               .fillColor("black")
                               .text('Extra 16 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra16)
 
                               .fillColor("black")
                               .text('Extra 17 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra17)
 
                               .fillColor("black")
                               .text('Extra 18 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra18)
 
                               .fillColor("black")
                               .text('Extra 19 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra19)
 
                               .fillColor("black")
                               .text('Extra 20 : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(results[0].extra20)
 
                               .fillColor("black")
                               .text('Domain : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(domain)
 
                               .fillColor("black")
                               .text('Alternate Phone No : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(alternatePhoneNo)
 
                               .fillColor("black")
                               .text('Comments : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(comments)
 
                               .fillColor("black")
                               .text('LinkedIn : ', {
                                 width: 465,
                                 continued: true
                               }).fillColor('blue')
                               .text(linkedIn)
 
                             if (resultsCamp[0].marketingChannel == "Email/Telemarketing") {
                               doc.text('')
                                 .fillColor("black")
                                 .text('Channel : ', {
                                   width: 465,
                                   continued: true
                                 }).fillColor('blue')
                                 .text(channel)
                             }
                             doc.text('')
                               .moveDown(2.0)
                               .fillColor("orange")
                               .text('Custom Questions', { underline: true })
                               .moveDown(1.0)
                             .fillColor("black")
                               //Supriya, Task:3091 - Display custom question in table format
                               if(questionResult.length>0)
                               {
                                 var customQuestionMapColumns = [];
                                 var addCustomQuestionColumns = [];
                                 //Supriya, Task:3091 - if alias name is required then add alias name column in table
                                 if(resultsCamp[0].customQuestionAliasName === 'Yes')
                                 {
                                   for( var q=0;q<questionResult.length;q++) {
                                     var aliasName = unescape(questionResult[q].aliasName);
                                     var customQuestion = unescape(questionResult[q].customQuestion);
                                     var answer = unescape(questionResult[q].answer);
                                     var disAllowAnswer = unescape(questionResult[q].disAllowAnswer);
                                     //Supriya, Task:3091 - if values is blank then add space for that key because voilab-pdf-table library will stop executing code if there is no value for that key may it's space
                                     if(aliasName === ""){
                                       aliasName = " ";
                                     }
                                     if(customQuestion === ""){
                                       customQuestion = " ";
                                     }
                                     if(answer === ""){
                                       answer = " ";
                                     }
                                     if(disAllowAnswer === ""){
                                       disAllowAnswer = " ";
                                     }
                                     //Supriya, Task:3091 - push value for all column in customQuestionMapColumns array
                                     customQuestionMapColumns.push({ mapAliasName:aliasName, mapQuestions: customQuestion, answer, disAllowAnswer});
                                   }
                                   //Supriya, Task:3091 - push column name for table in addCustomQuestionColumns array
                                   addCustomQuestionColumns.push(
                                     {
                                     id: 'mapAliasName',
                                     header: 'Alias',
                                     padding: [5, 5, 5, 5],
                                     align: 'left',
                                     width: 70,
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.mapAliasName
                                     }
 
                                   },
                                   {
                                     id: 'mapQuestions',
                                     header: 'Question',
                                     padding: [5, 5, 5, 5],
                                     align: 'left',
                                     width: 150,
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.mapQuestions
                                     }
 
                                   },
                                   {
                                     id: 'answer',
                                     header: 'Answer',
                                     padding: [5, 5, 5, 5],
                                     width: 150,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.answer
                                     }
 
                                   },
                                   {
                                     id: 'disAllowAnswer',
                                     header: 'Not Allow Answer',
                                     padding: [5, 5, 5, 5],
                                     width: 100,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.disAllowAnswer
                                     }
 
                                   })
                                 }else{
                                   //Supriya, Task:3091 - for loop for all question to unescape and add value
                                   for( var q=0;q<questionResult.length;q++) {
                                   
                                     var customQuestion = unescape(questionResult[q].customQuestion);
                                     var answer = unescape(questionResult[q].answer);
                                     var disAllowAnswer = unescape(questionResult[q].disAllowAnswer);
                                    //Supriya, Task:3091 - if values is blank then add space for that key because voilab-pdf-table library will stop executing code if there is no value for that key may it's space
                                     if(customQuestion === ""){
                                       customQuestion = " ";
                                     }
                                     if(answer === ""){
                                       answer = " ";
                                     }
                                     if(disAllowAnswer === ""){
                                       disAllowAnswer = " ";
                                     }
                                     //Supriya, Task:3091 - push value for all column in customQuestionMapColumns array
                                     customQuestionMapColumns.push({ mapQuestions: customQuestion, answer, disAllowAnswer});
                                   }
                                   //Supriya, Task:3091 - push column name for table in addCustomQuestionColumns array
                                   addCustomQuestionColumns.push(
                                   {
                                     id: 'mapQuestions',
                                     header: 'Question',
                                     padding: [5, 5, 5, 5],
                                     align: 'left',
                                     width: 200,
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.mapQuestions
                                     }
 
                                   },
                                   {
                                     id: 'answer',
                                     header: 'Answer',
                                     padding: [5, 5, 5, 5],
                                     width: 200,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.answer
                                     }
 
                                   },
                                   {
                                     id: 'disAllowAnswer',
                                     header: 'Not Allow Answer',
                                     padding: [5, 5, 5, 5],
                                     width: 100,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.disAllowAnswer
                                     }
 
                                   })
                                 }
                                 questionTable = new PdfTable(doc, {
                                   bottomMargin: 30
                                 });
   
 
                                 questionTable
                                   // add some plugins (here, a 'fit-to-width' for a column)
                                   .addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
                                     column: 'mapQuestions',
                                     align: 'center',
                                   }))
                                   // set defaults to your columns
 
                                   .setColumnsDefaults({
                                     headerBorder: ['L', 'T', 'B', 'R'],
                                     border: ['L', 'T', 'B', 'R'],
                                     align: 'center',
                                     headerPadding: [5, 5, 5, 5],
   
                                   })
   
                                   // add table columns
   
                                   .addColumns(addCustomQuestionColumns)
                                   // add events (here, we draw headers on each new page)
                                   .onPageAdded(function (tb) {
                                     // tb.addHeader();
                                     tb.pdf.fillColor('blue');
                                   });
                                 // draw content, by passing data to the addBody method
                                 questionTable.addBody(customQuestionMapColumns);
 
 
                                 doc
                                 .fontSize(12)
                                 .text('', 70);
                              
                               }
 
 
 
                          doc.moveDown(2.0)
                             .text(' ')
                             .fillColor("orange")
                             .text('Delivery Format Mapping', { underline: true })
                             .moveDown(1.0)
                             .fillColor("black")
 
 
                             if (deliveryMappingResult.length > 0) {
                               var deliveryFormatMapColumns = [];
                               deliveryFormatMapColumns.push({ mapQuestions: 'Publisher ID', field: deliveryMappingResult[0].pID, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Campaign ID", field: deliveryMappingResult[0].campID, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Campaign Name", field: deliveryMappingResult[0].campaignName, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Lead Interaction Date", field: deliveryMappingResult[0].leadInteractionDate, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "First Name", field: deliveryMappingResult[0].firstName, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Last Name", field: deliveryMappingResult[0].lastName, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Company Name", field: deliveryMappingResult[0].companyName, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Linkedin Company Name", field: deliveryMappingResult[0].linkedInCompanyName, values: " " });
 
                               deliveryFormatMapColumns.push({ mapQuestions: "Email", field: deliveryMappingResult[0].email, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Work Phone", field: deliveryMappingResult[0].workPhone, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Work Phone Format", field: deliveryMappingResult[0].workPhoneFormat, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Job Title", field: deliveryMappingResult[0].jobTitle, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Linkedin Job Title", field: deliveryMappingResult[0].linkedInJobTitle, values: " " });
 
                               if (results[0].jobLevel == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Job Level", field: deliveryMappingResult[0].jobLevel, values: " " });
                               }
 
                               if (results[0].jobFunction == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Job Function", field: deliveryMappingResult[0].jobFunction, values: " " });
                               }
 
 
                               deliveryFormatMapColumns.push({ mapQuestions: "Country", field: deliveryMappingResult[0].country, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Address", field: deliveryMappingResult[0].address, values: " " });
                               if (results[0].street == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Street", field: deliveryMappingResult[0].street, values: " " });
                               }
 
                               deliveryFormatMapColumns.push({ mapQuestions: "City", field: deliveryMappingResult[0].city, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "State", field: deliveryMappingResult[0].state, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Zip Code", field: deliveryMappingResult[0].zipCode, values: " " });
                               deliveryFormatMapColumns.push({ mapQuestions: "Company Employee Size", field: deliveryMappingResult[0].companyEmployeeSize, values: " " });
                               if (results[0].companyRevenue == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Company Revenue", field: deliveryMappingResult[0].companyRevenue, values: " " });
                               }
 
                               deliveryFormatMapColumns.push({ mapQuestions: "Industry", field: deliveryMappingResult[0].industry, values: " " });
                               if (results[0].ip == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "IP", field: deliveryMappingResult[0].ip, values: " " });
                               }
 
                               if (results[0].supportDocID == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Asset ID", field: deliveryMappingResult[0].supportDocID, values: " " });
                               }
                               if (results[0].assetNameTouch1 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Asset Name Touch 1", field: deliveryMappingResult[0].assetNameTouch1, values: " " });
 
                                 deliveryFormatMapColumns.push({ mapQuestions: "Asset Timestamp Touch 1", field: deliveryMappingResult[0].assetTimestampTouch1, values: " " });
                               }
                               if (results[0].assetNameTouch2 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Asset Name Touch 2", field: deliveryMappingResult[0].assetNameTouch2, values: " " });
 
                                 deliveryFormatMapColumns.push({ mapQuestions: "Asset Timestamp Touch 2", field: deliveryMappingResult[0].assetTimestampTouch2, values: " " });
                               }
                               if (results[0].assetNameTouch3 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Asset Name Touch 3", field: deliveryMappingResult[0].assetNameTouch3, values: " " });
 
                                 deliveryFormatMapColumns.push({ mapQuestions: "Asset Timestamp Touch 3", field: deliveryMappingResult[0].assetTimestampTouch3, values: " " });
                               }
                               if (results[0].assetName == "Yes") {
                                 if (results[0].assetNameTouch1 == "Yes" || results[0].assetNameTouch2 == "Yes" || results[0].assetNameTouch3 == "Yes") { }
                                 else {
                                   deliveryFormatMapColumns.push({ mapQuestions: "Asset Name", field: deliveryMappingResult[0].assetName, values: " " });
                                 }
                               }
 
 
                               deliveryFormatMapColumns.push({ mapQuestions: "Allocation ID", field: deliveryMappingResult[0].reAllocationID, values: " " });
                               if (results[0].domain == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Domain", field: deliveryMappingResult[0].domain, values: " " });
                               }
 
                               if (results[0].alternatePhoneNo == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Alternate Phone No.", field: deliveryMappingResult[0].alternatePhoneNo, values: " " });
                               }
                               if (results[0].channel == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Channel", field: deliveryMappingResult[0].channel, values: " " });
                               }
 
                               if (results[0].comments == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Comments", field: deliveryMappingResult[0].comments, values: " " });
                               }
 
                               if (results[0].linkedIn == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "LinkedIn", field: deliveryMappingResult[0].linkedIn, values: " " });
                               }
 
                               if (results[0].additionalComments == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Additional Comments", field: deliveryMappingResult[0].additionalComments, values: " " });
                               }
 
                               if (results[0].extra1 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra1", field: deliveryMappingResult[0].extra1, values: " " });
                               }
 
                               if (results[0].extra2 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra2", field: deliveryMappingResult[0].extra2, values: " " });
                               }
 
                               if (results[0].extra3 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra3", field: deliveryMappingResult[0].extra3, values: " " });
                               }
 
                               if (results[0].extra4 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra4", field: deliveryMappingResult[0].extra4, values: " " });
                               }
 
                               if (results[0].extra5 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra5", field: deliveryMappingResult[0].extra5, values: " " });
                               }
                               //Somnath Task-3137, Add Extra Fields
                               if (results[0].extra6 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra6", field: deliveryMappingResult[0].extra6, values: " " });
                               }
                              
                               if (results[0].extra7 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra7", field: deliveryMappingResult[0].extra7, values: " " });
                               }
 
                               if (results[0].extra11 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra11", field: deliveryMappingResult[0].extra11, values: " " });
                               }
 
                               if (results[0].extra12 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra12", field: deliveryMappingResult[0].extra12, values: " " });
                               }
                              
                               if (results[0].extra13 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra13", field: deliveryMappingResult[0].extra13, values: " " });
                               }
 
                               if (results[0].extra14 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra14", field: deliveryMappingResult[0].extra14, values: " " });
                               }
                             
                               if (results[0].extra15 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra15", field: deliveryMappingResult[0].extra15, values: " " });
                               }
                              
                               if (results[0].extra16 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra16", field: deliveryMappingResult[0].extra16, values: " " });
                               }
 
                               if (results[0].extra17 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra17", field: deliveryMappingResult[0].extra17, values: " " });
                               }
 
                               if (results[0].extra18 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra18", field: deliveryMappingResult[0].extra18, values: " " });
                               }
                              
                               if (results[0].extra19 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra19", field: deliveryMappingResult[0].extra19, values: " " });
                               }
 
                               if (results[0].extra20 == "Yes") {
                                 deliveryFormatMapColumns.push({ mapQuestions: "Extra20", field: deliveryMappingResult[0].extra20, values: " " });
                               }
 
                               table = new PdfTable(doc, {
                                 bottomMargin: 30
                               });
 
                               table
                                 // add some plugins (here, a 'fit-to-width' for a column)
                                 .addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
                                   column: 'mapQuestions',
                                   align: 'center',
                                 }))
                                 // set defaults to your columns
 
                                 .setColumnsDefaults({
                                   headerBorder: ['L', 'T', 'B', 'R'],
                                   border: ['L', 'T', 'B', 'R'],
                                   align: 'center',
                                   headerPadding: [5, 5, 5, 5],
 
                                 })
 
                           
                                 // add table columns
 
                                 .addColumns([
                                   {
                                     id: 'mapQuestions',
                                     header: 'System Field',
                                     padding: [5, 5, 5, 5],
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.mapQuestions
                                     }
 
                                   },
                                   {
                                     id: 'field',
                                     header: 'Mapping Alias Field',
                                     padding: [5, 5, 5, 5],
                                     width: 250,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.field
                                     }
 
                                   },
                                   {
                                     id: 'values',
                                     header: 'Values',
                                     padding: [5, 5, 5, 5],
                                     width: 80,
                                     align: 'left',
                                     renderer: function (tb, data) {
                                       tb.pdf.fillColor('blue');
                                       tb.pdf.font('Helvetica'); return data.values
                                     }
 
                                   }
                                 ])
                                 // add events (here, we draw headers on each new page)
                                 .onPageAdded(function (tb) {
                                   // tb.addHeader();
                                   table.pdf.fillColor('blue');
                                 });
 
                               // draw content, by passing data to the addBody method
                               table.addBody(deliveryFormatMapColumns);
                             }
 
                             doc.scale(0.6)
                               .translate(470, -380)
                               .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
                               .fill('red', 'even-odd')
                               .restore();
 
 
 
                             res.setHeader('Content-disposition', 'attachment; filename="' + pdfFilename + '"')
                             res.setHeader('Content-type', 'application/pdf')
                             doc.pipe(res)
                             doc.end()
                           })
                         })
                       })
                     // }
                   })
               })
               // }
             })
         })
 
 
     })
   //}
 });
 
 
 /**
        * @author Sonali Kalke
        * @param  Description fetch list of pending Campaigns in agency "Pending campaign tab"
        * @return Description return All pending Campaign in agency "Pending campaign tab"
        */
 
 router.get("/pendingCampaignInAgency", function (req, res, next) {
   log.info("inside pendingCampaignInAgency");
   var lpPending = properties.get('pubStatus.pendingCampaign');
 
 
   var accept = properties.get('pubStatus.acceptCampaign');
 
   var approve = properties.get('pubStatus.approve');
 
   var errors;
   var agencyID = url.parse(req.url, true).query.agencyID;
 
 
 
   var lpStatus = properties.get('pubStatus.pendingCampaign');
   var sql = "select pa.allocationID,pa.pID, pa.campID,c.agencyID,c.clientCampID, c.campaignName,c.ABM,c.leadAllocation,pa.startDate,pa.endDate,pa.CPL,pa.status,c.currency,c.parentCampID,c.reallocationID from campaign c join publisher_allocation pa on c.campID = pa.campID left outer join landing_page_details ld on pa.campID=ld.campID and pa.pID=ld.pID left outer join poc_details pd on pd.campID=pa.campID and pa.pID=pd.pID left outer join call_script_details cs on cs.campID=pa.campID and pa.pID=cs.pID where (pa.status= '" + lpPending + "' or (pa.status='" + accept + "' and  (ld.status!='" + approve + "' or pd.status!='" + approve + "'  or cs.status!='Approved') )) and c.agencyID='" + agencyID + "' group by pa.campID desc";
 
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error=" + error);
       return res.status(400).json(errors);
     }
     else {
 
       if (results.length > 0) {
         if (results[0].pID === null) {
         } else {
           res.send(JSON.stringify(results));
         }
       }
 
     }
   });
   // //pool.end();
 });
 
 /**
        * @author Sonali Kalke
        * @param  Description returns list having review pending status
        */
 
 router.post("/POCReviewPending", function (req, res, next) {
   log.info("inside POCReviewPending");
   var campID = req.body.campID;
   var pID = req.body.pID;
   var errors;
   var agencyReviewPending = properties.get('agencyStatus.agencyReviewPending')
   var approve = properties.get('pubStatus.approve');
   var sql = "SELECT pd.campID,pd.pID,p.publisherName,sd.supportDocID,sd.suppDocName,pd.pocFileName,pd.status as pocStatus,pd.status as poc_status,pd.feedback as pocFeedback,pocFeedbackFileName FROM poc_details pd join publisher p on pd.pID=p.pID join supporting_document sd on sd.supportDocID = pd.supportDocID where pd.campID='" + campID + "' and pd.pID='" + pID + "' and (pd.status='" + agencyReviewPending + "' OR pd.status='Approved' OR pd.status='Rejected')";
 
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error In POCReviewPending" + error);
 
       return res.status(400).json(errors);
     } else {
       res.send(JSON.stringify(results));
     }
 
   });
   //pool.end();
 });
 
 /*@author sonali
  * Desc displaying all POC without selecting publisher
  @version 1.0
  */
 router.get("/POCPageDetails", function (req, res, next) {
   log.info("Inside POCPageDetails");
   var campID = url.parse(req.url, true).query.campID;
   var errors;
   var pendingSubmission = properties.get('agencyStatus.pendingSubmission')
   pool.query(
     "select pd.campID,p.publisherName,p.pID, pd.supportDocID,pd.pocFileName,sd.suppDocName,pd.status as pocStatus,pd.status as poc_status, pd.feedback as pocFeedback,pocFeedbackFileName from poc_details pd join publisher p on p.pID = pd.pID join supporting_document sd  on sd.supportDocID = pd.supportDocID   where pd.campID='" + campID + "' and pd.status!='" + pendingSubmission + "'",
     function (error, results, fields) {
       if (error) {
         log.error("Error inside POCPageDetails==>" + error);
         return res.status(400).json(errors);
       } else {
         res.send(JSON.stringify(results));
       }
     });
   //pool.end();
 });
 
 /*@author sonali Kalke
  * Desc show campID from publisherAllcation table and campaignName from Campaign Table 
  @version 1.0
  */
 router.get("/POCReviewPendingForCampID", function (req, res, next) {
   log.info("inside POCReviewPendingForCampID");
   var campID = url.parse(req.url, true).query.campID;
   pool.query(
     "select pa.campID,c.campaignName,c.clientCampID from publisher_allocation pa \
 join campaign c on c.campID = pa.campID\
  WHERE pa.campID  =? group by pa.campID",
     [campID],
     function (error, results, fields) {
       if (error) {
         log.error("Error inside POCReviewPendingForCampID==>" + error);
         throw error;
       }
       res.send(JSON.stringify(results));
     }
   );
   //pool.end();
 });
 
 
 
 
 /*@author sonali Kalke
  * Desc Submit the POC  Feedback
  @version 1.0
  */
 router.post("/submitPOCFeedback", function (req, res, next) {
   log.info("inside submitPOCFeedback");
   var campID = req.body.campID;
   var description=campaignTraceProperties.get('campaign.review.poc');//Sonali-3257-get details from properties file
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var success;
   var errors;
   var AgencyReviewPending = properties.get('pubStatus.lpSubmission');
   /**
     * @author sonali Kalke
     * @param  Description handle the Email functionality
     * @return Description return All Email
     */
 
   var user = req.body.user;
   var user_role = "AC";
   var newDynamicArray = [];
   newDynamicArray = req.body.dynamicArray;
 
   for (var i = 0, l = newDynamicArray.length; i < l; i++) {
 
     try {
       /* Cannot Insert if status is not Selected in LP Review  */
       if (newDynamicArray[i].status != AgencyReviewPending) {
         var feedback = newDynamicArray[i].feedback;
         if (feedback === undefined || feedback === 'undefined' || feedback === null || feedback === 'null') { feedback = ''; }
         var sql = "UPDATE poc_details SET status ='" + newDynamicArray[i].status + "', feedback ='" + feedback + "',lastUpdated='" + formatted + "' WHERE campID ='" + campID + "'AND pID='" + newDynamicArray[i].pID + "'AND supportDocID ='" + newDynamicArray[i].supportDocID + "'";
         pool.query(sql, function (error, results, fields) {
           if (error) {
             log.error("Error inside submitPOCFeedback==>" + error);
             errors.publisher = "Feedback not submited";
             return res.status(400).json(errors);
 
           } else {
             success = "Submitted feedback successfully.Please click on back to Live Campaign link";
             //res.json({ success: true, message: success });
           }
         });
 
         var sql1 = "insert into campaign_log (campID,agency_ID,pID,suppDocID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + newDynamicArray[i].pID + "','" + newDynamicArray[i].supportDocID + "','" + newDynamicArray[i].status + "','" + description + "','" + req.body.user.userID + "','" + req.body.user.firstName + "','" + req.body.user.lastName + "','" + formatted + "')";
         pool.query(sql1, function (error, results, fields) {
           if (error) {
           }
         });
       }/* End of IF Block which Status != AgencyReviewPending */
 
     } catch (error) {
       errors.publisher = "Feedback not submited";
       return res.status(400).json(errors);
     }
     // //pool.end();
 
   }// end of for loop
 
 
   /**
  * @author sonali Kalke
  * @param  Description handle the Email Functionality 
  * @return Description return successfully review POC 
  */
 
 
   var user_role = "PC";
   var user_role1 = "AC";
   var publisherLoginDetails = [];
 
   // only find the unique pID from newDyanamicArray
   const result_pID = Array.from(new Set(newDynamicArray.map(p => p.pID))).map(pID => {
     return {
       pID: pID,
       // publisherName:newDynamicArray.find(p=>p.pID=== pID).publisherName,
       // startDate:newDynamicArray.find(p=>p.pID=== pID).startDate,
       // endDate:newDynamicArray.find(p=>p.pID=== pID).endDate,
       // allocatedLead:newDynamicArray.find(p=>p.pID=== pID).allocatedLead,
       // cpl:newDynamicArray.find(p=>p.pID=== pID).cpl
     };
   });
 
   for (var s = 0; s < result_pID.length; s++) {
     let count1 = s;
     //get all agency details from user_details table
 
     var queryTemp = "select ud.userID,ud.orgID,ud.userName,ud.role from user_details ud join email_configuration ec on ud.userID=ec.userID where (ud.role='" + user_role1 + "' and ud.orgID='" + user.id + "'  and ec.pocReview='" + emailConfigYes + "') OR (ud.role='" + user_role + "' AND ud.orgID='" + result_pID[count1].pID + "'  and ec.pocReview='" + emailConfigYes + "')";
 
     pool.query(queryTemp, function (err, results, fields) {
       if (err) {
         log.error("Error=" + err);
         // errors.publisher="Campaign not allocated";
         return res.status(400).json(errors);
       } else {
 
         email.pocPageReview(user, campID, results, result_pID[count1].pID);
       }
     });
   }
   success = 'Submitted feedback successfully.Please click on back to Pending Campaign link';
   res.json({ success: true, message: success });
 
   // res.send(JSON.stringify(results));
 
 });
 
 
 /**
  * @author Somnath Keswad
  * Desc Download POC file by clicking on its name
  * @version 1.0 Return buffer
  **/
 //Somnath Task-3858, Add checkAuth middleware
 router.get("/pocFileDownload",authCheck, function (req, res, next) {
   log.info("In Publisher/pocFileDownload");
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var supportDocID = url.parse(req.url, true).query.supportDocID;
   var sql = "select * from poc_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error Publishers/pocFileDownload:" + error);
     }
     else {
       var pocFile = results[0].pocDocument;
       var pocFileName = results[0].pocFileName;
       var pocFileExt = pocFileName.split('.').pop();
       if (pocFileExt === 'pdf') {
         res.setHeader('Content-disposition', 'attachment; pocFileName="' + pocFileName + '"')
         res.setHeader('Content-type', 'application/pdf')
         res.send(Buffer.from(pocFile, 'binary'))
       }
 
       if (pocFileExt === 'ppt' || pocFileExt === 'pptx') {
         res.send(Buffer.from(pocFile, 'binary'))
       }
 
       if (pocFileExt === 'txt') {
         res.send(Buffer.from(pocFile, 'binary'))
       }
 
       if (pocFileExt === 'docx') {
         res.send(Buffer.from(pocFile, 'binary'))
       }
       if (pocFileExt === 'png' || pocFileExt === 'jpeg' || pocFileExt === 'jpg' || pocFileExt === 'PNG' || pocFileExt === 'JPEG' || pocFileExt === 'JPG') {
         res.send(Buffer.from(pocFile, 'binary'))
       }
     }
   });
 });// End of pocFileDownload
 
 /*@author Supriya Gore
 * Desc Download LP Feedback file by clicking on its name
 @version 1.0
 */
 router.get("/lpFeedbackFileDownload", function (req, res, next) {
   /**** Everything Changes done by Somnath Keswad as per requirment*/
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var supportDocID = url.parse(req.url, true).query.supportDocID;
   var sql = "select lpFeedbackFile,lpFeedbackFileName from landing_page_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error in downloading LP Feedback File :" + error);
     }
     else {
       var lpFeedbackFile = results[0].lpFeedbackFile;
       var lpFile = lpFeedbackFile.data;
       var lpFeedbackFileName = results[0].lpFeedbackFileName;
       var lpFeedbackFileExt = lpFeedbackFileName.split('.').pop();
       if (lpFeedbackFileExt === 'pdf') {
         res.setHeader('Content-disposition', 'attachment; filename="' + lpFeedbackFileName + '"')
         res.setHeader('Content-type', 'application/pdf')
 
         res.send(Buffer.from(lpFeedbackFile, 'binary'));
       }
 
       if (lpFeedbackFileExt === 'ppt' || lpFeedbackFileExt === 'pptx') {
         res.send(Buffer.from(lpFeedbackFile, 'binary'));
       }
 
       if (lpFeedbackFileExt === 'txt') {
         res.send(Buffer.from(lpFeedbackFile, 'binary'));
       }
 
       if (lpFeedbackFileExt === 'docx' || lpFeedbackFileExt === 'doc') {
         res.send(Buffer.from(lpFeedbackFile, 'binary'));
       }
 
       if (lpFeedbackFileExt === 'png' || lpFeedbackFileExt === 'jpeg' || lpFeedbackFileExt === 'jpg' || lpFeedbackFileExt === 'PNG' || lpFeedbackFileExt === 'JPEG' || lpFeedbackFileExt === 'JPG') {
         res.send(Buffer.from(lpFeedbackFile, 'binary'))
       }
       //  else{
       //   res.send(Buffer.from(lpFeedbackFile, 'binary'))
       //  }
 
     }
   });
   ////pool.end();
 });
 
 /*@author Supriya Gore
  * Desc Download POC Feedback file by clicking on its name
  @version 1.0
  */
 router.get("/pocFeedbackFileDownload", function (req, res, next) {
   /**** Everything Changes done by Somnath Keswad as per requirment*/
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var supportDocID = url.parse(req.url, true).query.supportDocID;
   var sql = "select pocFeedbackFile,pocFeedbackFileName from poc_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error in downloading LP Feedback File :" + error);
     }
     else {
       var pocFeedbackFile = results[0].pocFeedbackFile;
       var pocFeedbackFileName = results[0].pocFeedbackFileName;
       var pocFeedbackFileExt = pocFeedbackFileName.split('.').pop();
       if (pocFeedbackFileExt === 'pdf') {
         res.setHeader('Content-disposition', 'attachment; filename="' + pocFeedbackFileName + '"')
         res.setHeader('Content-type', 'application/pdf')
 
         res.send(Buffer.from(pocFeedbackFile, 'binary'));
       }
 
       if (pocFeedbackFileExt === 'ppt' || pocFeedbackFileExt === 'pptx') {
         res.send(Buffer.from(pocFeedbackFile, 'binary'));
       }
 
       if (pocFeedbackFileExt === 'txt') {
         res.send(Buffer.from(pocFeedbackFile, 'binary'));
       }
 
       if (pocFeedbackFileExt === 'docx' || pocFeedbackFileExt === 'doc') {
         res.send(Buffer.from(pocFeedbackFile, 'binary'));
       }
 
       if (pocFeedbackFileExt === 'png' || pocFeedbackFileExt === 'jpeg' || pocFeedbackFileExt === 'jpg' || pocFeedbackFileExt == 'PNG' || pocFeedbackFileExt == 'JPEG' || pocFeedbackFileExt == 'JPG') {
         res.send(Buffer.from(pocFeedbackFile, 'binary'))
       }
       //  else{
       //   res.send(Buffer.from(lpFeedbackFile, 'binary'))
       //  }
 
     }
   });
   ////pool.end();
 });
 
 
 /*@author Supriya Gore
  * Desc Download POC Feedback file by clicking on its name
  @version 1.0
  */
 router.get("/csFeedbackFileDownload", function (req, res, next) {
   /**** Everything Changes done by Somnath Keswad as per requirment*/
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var supportDocID = url.parse(req.url, true).query.supportDocID;
   var sql = "select csFeedbackFile,csFeedbackFileName from call_script_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error in downloading LP Feedback File :" + error);
     }
     else {
       var csFeedbackFile = results[0].csFeedbackFile;
       var csFeedbackFileName = results[0].csFeedbackFileName;
       var csFeedbackFileExt = csFeedbackFileName.split('.').pop();
       if (csFeedbackFileExt === 'pdf') {
         res.setHeader('Content-disposition', 'attachment; filename="' + csFeedbackFileName + '"')
         res.setHeader('Content-type', 'application/pdf')
 
         res.send(Buffer.from(csFeedbackFile, 'binary'));
       }
 
       if (csFeedbackFileExt === 'ppt' || csFeedbackFileExt === 'pptx') {
         res.send(Buffer.from(csFeedbackFile, 'binary'));
       }
 
       if (csFeedbackFileExt === 'txt') {
         res.send(Buffer.from(csFeedbackFile, 'binary'));
       }
 
       if (csFeedbackFileExt === 'docx' || csFeedbackFileExt === 'doc') {
         res.send(Buffer.from(csFeedbackFile, 'binary'));
       }
 
       if (csFeedbackFileExt === 'png' || csFeedbackFileExt === 'jpeg' || csFeedbackFileExt === 'jpg' || csFeedbackFileExt === 'PNG' || csFeedbackFileExt === 'JPEG' || csFeedbackFileExt === 'JPG') {
         res.send(Buffer.from(csFeedbackFile, 'binary'))
       }
       //  else{
       //   res.send(Buffer.from(lpFeedbackFile, 'binary'))
       //  }
 
     }
   });
   ////pool.end();
 });
 
 
 /*@author sonali
 * Desc Download CS file by clicking on its name
 @version 1.0
 */
 
 //Somnath Task-3858, Add checkAuth middleware
 router.get("/csFileDownload",authCheck, function (req, res, next) {
   /**** Everything Changes done by Somnath Keswad as per requirment*/
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var supportDocID = url.parse(req.url, true).query.supportDocID;
   var sql = "select * from call_script_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error in downloading CS File :" + error);
     }
     else {
       var csFile = results[0].csDocument;
       var csFileName = results[0].csFileName;
       var csFileExt = csFileName.split('.').pop();
       if (csFileExt === 'pdf') {
         res.setHeader('Content-disposition', 'attachment; csFileName="' + csFileName + '"')
         res.setHeader('Content-type', 'application/pdf')
         res.send(Buffer.from(csFile, 'binary'))
       }
 
       if (csFileExt === 'ppt' || csFileExt === 'pptx') {
         res.send(Buffer.from(csFile, 'binary'))
       }
 
       if (csFileExt === 'txt') {
         res.send(Buffer.from(csFile, 'binary'))
       }
 
       if (csFileExt === 'docx') {
         res.send(Buffer.from(csFile, 'binary'))
       }
       if (csFileExt === 'png' || csFileExt === 'jpeg' || csFileExt === 'jpg') {
         res.send(Buffer.from(csFile, 'binary'))
       }
 
     }
   });
   //pool.end();
 });
 
 
 //  /**
 //  * @author Sonali Kalke
 //  * @param  Description Check LP Approved and POC upload and update status of publisher(on approval of all assets)
 //  * @return Description return update status of publisher and send response
 //  */
 // router.get("/agencyLPAndPOCApproved", function(req, res, next) {
 
 //   //var campID = req.body.campID;
 //   var campID = url.parse(req.url, true).query.campID;
 //   //var lpApproved=properties.get('lpApprovedORReject.Approved');
 //   var lpApproved='Approved';
 
 //   var pending=properties.get('pubStatus.pendingCampaign');  
 //   var accept=properties.get('pubStatus.acceptCampaign'); 
 //   let pIDArray=[];
 //   pool.query(
 //     "select pa.pID,pa.allocationID,pa.campID,lp.status as lpStatus,poc.status as pocStatus from publisher_allocation pa join landing_page_details lp on pa.pID=lp.pID and pa.campID=lp.campID join poc_details poc on pa.pID=poc.pID and pa.campID=poc.campID where pa.status='"+pending+"'and pa.campID='"+campID+"'",
 //     function(error, results, fields) {
 //       if (error) 
 //       {
 //       }else{
 
 //         let pIDArray=Array.from(new Set(results.map(p=>p.pID))).map(pID=>{
 //           return{
 //             pID:pID
 //            };
 //         });
 //      
 
 //         for(var k=0;k<pIDArray.length;k++)
 
 //         {
 //           var acceptStatus,pendingStatus=false;
 //           var status;
 
 //         for(var i=0;i<results.length;i++)
 //         {
 //         
 
 //             if(pIDArray[k].pID==results[i].pID)
 //               {
 //           if((results[i].lpStatus==='Approved' && results[i].pocStatus==='Approved')){
 
 //             acceptStatus=true;
 
 //           }
 //           else{
 
 //             pendingStatus=true;
 
 //           }
 //         }
 //         }
 //          if(pendingStatus===false){
 //           status='Accept'
 
 //           var sql="update publisher_allocation set status='"+status+"' where campID='"+campID+"' and pID='"+pIDArray[k].pID+"'";
 //           pool.query(
 //            sql,function(error1, pubResults, fields)
 //             {
 //               if(error1)
 //               {
 //               }else{
 //               }
 //             })
 //           }
 //         }
 
 //       }
 //       res.send(JSON.stringify(results));
 
 //     }
 //   );
 //   ////pool.end();
 // });
 
 
 /**
  * @author Sonali Kalke
  * @param  Description Check LP Approved and POC upload and update status of publisher
  * @return Description return update status of publisher and send response
  */
 //Somnath Task-3858, Add checkAuth middleware
 router.get("/agencyLPAndPOCApproved",authCheck, function (req, res, next) {
   log.info("Inside agencyLPAndPOCApproved ");
   let AgencyApproved = properties.get("agencyStatus.creatives.Agency_Approved")
   var campID = url.parse(req.url, true).query.campID;
   //var lpApproved=properties.get('lpApprovedORReject.Approved');
   var lpApproved = 'Approved';
   var AdvertiserReviewPending = properties.get('agencyStatus.creatives.clientReviewPending');
   var AdvertiserCreativeApproved = properties.get('advertiserStatus.creative.clientApproved');
   var AdvertiserRejected = properties.get('advertiserStatus.creative.clientRejected')
   var pending = properties.get('pubStatus.pendingCampaign');
   var accept = properties.get('pubStatus.acceptCampaign');
   var lpPending = properties.get('pubStatus.pendingCampaign');
 
 
   var accept = properties.get('pubStatus.acceptCampaign');
 
   var approve = properties.get('pubStatus.approve');
   let pIDArray = [];
   var sql1 = "select marketingChannel from campaign where campID='" + campID + "'";
   pool.query(sql1, function (err, resultCamp, fields) {
     if (err) {
       log.info("Error is===>" + err);
     }
     else {
 
       var sql = "select pa.pID,pa.allocationID,pa.campID,lp.status as lpStatus,poc.status as pocStatus,cs.status as csStatus from publisher_allocation pa left join landing_page_details lp on pa.pID=lp.pID and pa.campID=lp.campID left join poc_details poc on pa.pID=poc.pID and pa.campID=poc.campID left join call_script_details cs on pa.pID=cs.pID and pa.campID=cs.campID where (pa.status= '" + lpPending + "' or (pa.status='" + accept + "' and  (lp.status!='" + approve + "' or poc.status!='" + approve + "' or cs.status!='" + approve + "'))) and pa.campID='" + campID + "'";
 
       pool.query(sql, function (error, results, fields) {
         if (error) {
           log.info("Error:" + error);
         } else {
 
           let pIDArray = Array.from(new Set(results.map(p => p.pID))).map(pID => {
             return {
               pID: pID
             };
           });
 
           for (let k = 0; k < pIDArray.length; k++) {
             var acceptStatus = false, pendingStatus = false;
             var status;
 
             for (let i = 0; i < results.length; i++) {
 
               if (pIDArray[k].pID == results[i].pID) {
 
                 if (resultCamp[0].marketingChannel == "Email") {
 
                   if ((results[i].lpStatus === 'Approved' || (results[i].lpStatus === 'Approved' && results[i].pocStatus === 'Approved')) || (results[i].lpStatus === AdvertiserCreativeApproved || (results[i].lpStatus === AdvertiserCreativeApproved && results[i].pocStatus === AdvertiserCreativeApproved)) || (results[i].lpStatus === AdvertiserReviewPending || results[i].pocStatus === AdvertiserReviewPending) || (results[i].lpStatus === AgencyApproved || results[i].pocStatus === AgencyApproved)) {
                     acceptStatus = true;
                   }
                   else {
                     pendingStatus = true;
                   }
                 }//for email if loop ends 
 
                 else if (resultCamp[0].marketingChannel == "TeleMarketing") {
 
                   if (results[i].csStatus === 'Approved' || results[i].csStatus === AdvertiserCreativeApproved || results[i].csStatus === AdvertiserReviewPending || results[i].csStatus === AgencyApproved) {
                     acceptStatus = true;
                   }
                   else {
                     pendingStatus = true;
                   }
                 }//for Telemarketing if ends
                 else if (resultCamp[0].marketingChannel == "Email/Telemarketing" || resultCamp[0].marketingChannel == "EmailTelemarketing") {
 
                   if (results[i].lpStatus === 'Approved' || results[i].csStatus === 'Approved' || (results[i].lpStatus === 'Approved' && results[i].csStatus) || (results[i].lpStatus === 'Approved' && results[i].pocStatus === 'Approved') || (results[i].lpStatus === 'Approved' && results[i].pocStatus === 'Approved' && results[i].csStatus === 'Approved')
                     || results[i].lpStatus === AdvertiserCreativeApproved || results[i].csStatus === AdvertiserCreativeApproved || (results[i].lpStatus === AdvertiserCreativeApproved && results[i].csStatus) || (results[i].lpStatus === AdvertiserCreativeApproved && results[i].pocStatus === AdvertiserCreativeApproved) || (results[i].lpStatus === AdvertiserCreativeApproved && results[i].pocStatus === AdvertiserCreativeApproved && results[i].csStatus === AdvertiserCreativeApproved) || (results[i].lpStatus === AdvertiserReviewPending || results[i].pocStatus === AdvertiserReviewPending || results[i].csStatus === AdvertiserReviewPending) || (results[i].lpStatus === AgencyApproved || results[i].pocStatus === AgencyApproved || results[i].csStatus === AgencyApproved)) {
                     acceptStatus = true;
 
                   }
                   else {
                     pendingStatus = true;
                   }
 
                 }
                 else {
                   //do nothing
                 }
               }
             }
             if (acceptStatus === true) {
               status = 'Accept';
 
 
               var sql = "update publisher_allocation set status='" + status + "' where campID='" + campID + "' and pID='" + pIDArray[k].pID + "' and status NOT IN('Cancel','ReAssign') ";
               pool.query(
                 sql, function (error1, pubResults, fields) {
                 if (error1) {
                   log.error("Error in update:" + error1);
                 } else {
                 }
               })
             }
           }
 
         }
         res.send(JSON.stringify(results));
 
       }
       );
 
     }
   });
   ////pool.end();
 });
 
 
 /**
  * @author Somnath Keswad
  * @param  Description Download feedback file as per creative Type
  * @return Description return feedback File
  */
 //Somnath Task-3858, Add checkAuth middleware
 router.get("/feedbackFileDownload",authCheck, function (req, res, next) {
   log.info("In Publisher/feedbackFileDownload")
   var campID = url.parse(req.url, true).query.campID;
   var pID = url.parse(req.url, true).query.pID;
   var supportDocID = url.parse(req.url, true).query.supportDocID;
   var type = url.parse(req.url, true).query.type;
   if (type == 'LP') {
     var sql = "select * from landing_page_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   } else if (type == 'POC') {
     var sql = "select * from poc_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   } else {
     var sql = "select * from call_script_details where campID='" + campID + "' and pID='" + pID + "' and supportDocID='" + supportDocID + "'";
   }
   pool.query(sql, function (error, results, fields) {
     if (error) {
       log.error("Error Publisher/feedbackFileDownload:" + error);
     }
     else {
       if (type == 'LP') {
         var feedbackFile = results[0].lpFeedbackFile;
         var feedbackFileName = results[0].lpFeedbackFileName;
       } else if (type == 'POC') {
         var feedbackFile = results[0].pocFeedbackFile;
         var feedbackFileName = results[0].pocFeedbackFileName;
       } else {
         var feedbackFile = results[0].csFeedbackFile;
         var feedbackFileName = results[0].csFeedbackFileName;
       }
       var feedbackFileExt = feedbackFileName.split('.').pop();
       if (feedbackFileExt === 'pdf') {
         res.setHeader('Content-disposition', 'attachment; pocFileName="' + feedbackFileName + '"')
         res.setHeader('Content-type', 'application/pdf')
         res.send(Buffer.from(feedbackFile, 'binary'))
       }
 
       if (feedbackFileExt === 'ppt' || feedbackFileExt === 'pptx') {
         res.send(Buffer.from(feedbackFile, 'binary'))
       }
 
       if (feedbackFileExt === 'txt') {
         res.send(Buffer.from(feedbackFile, 'binary'))
       }
 
       if (feedbackFileExt === 'docx') {
         res.send(Buffer.from(feedbackFile, 'binary'))
       }
       if (feedbackFileExt === 'png' || feedbackFileExt === 'jpeg' || feedbackFileExt === 'jpg' || feedbackFileExt === 'PNG' || feedbackFileExt === 'JPEG' || feedbackFileExt === 'JPG') {
         res.send(Buffer.from(feedbackFile, 'binary'))
       }
     }
   });
 });//End of feedbackFileDownload
 
 /**
 * @author Supriya Gore
 * @param  Description get agency Details for Linking as per agency
 * @return Description return agency details as per agency
 */
 router.post("/agencyLinkReview", authCheck,function (req, res, next) {
   log.info("Inside agencyLinkReview");
 
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var pID=user.id;//Sonali-3718-get pID from token
      var pending = properties.get('admin.linkPending');
 
   var sql = "select u.agencyID,a.agencyName from user_mapping u join agency_details a on u.agencyID=a.agencyID join publisher p on u.pID=p.pID where u.pID=" + pID + " and u.publisherStatus='" + pending + "' order by u.agencyID desc";
 
   pool.query(sql, function (error, result, field) {
     if (error) {
       log.error("Error in publisher/agencyLinkReview is :" + error);
     }
     else {
       res.send(JSON.stringify(result));
     }
   });
 });
 
 
 /**
 * @author Supriya Gore
 * @param  Description get publisher Details for Linking as per agency
 * @return Description return publisher details as per agency
 */
 router.post("/agencyReviewDetails", function (req, res, next) {
   log.info("Inside agencyReviewDetails");
 
   var agencyID = req.body.agencyID;
   var pID = req.body.pID;
 
     //Sonali-3189-Added subContracting in the following query
 
   var sql = "select u.pID,u.MSA,u.NDA,u.RMD,u.IO,u.payment_terms,r.revenue_model,a.agencyName,a.email,a.country,a.state,a.city,a.zipcode,a.dcEmail,a.dcTelemarketing,a.dcDisplay,a.dcProgrammatic,a.dcSocial,a.subContracting,a.countryCode,a.website,a.phone,p.publisherName from user_mapping u join agency_details a on u.agencyID=a.agencyID join publisher p on u.pID=p.pID join revenue_model r on u.revenueModelID=r.revenueModelID where u.agencyID=" + agencyID + " and u.pID='" + pID + "'";
 
   pool.query(sql, function (error, result, field) {
     if (error) {
       log.error("Error in agencyReviewDetails is :" + error);
     }
     else {
       res.send(JSON.stringify(result));
     }
   });
 });
 
 
 
 /**
 * @author Supriya Gore
 * @param  Description get publisher Linking approve as per agency
 * @return Description return publisher approve as per agency
 */
 router.post("/agencyLinkApprove", function (req, res, next) {
   log.info("Inside agencyLinkApprove");
 
   var agencyID = req.body.agencyID;
   var pID = req.body.pID;
   var approve = properties.get('pubStatus.approve');
   var dt = dateTime.create();
   var formatted = dt.format('Y-m-d H:M:S');
 
   var sql = "update user_mapping set publisherStatus='" + approve + "',lastUpdated='" + formatted + "' where agencyID=" + agencyID + " and pID='" + pID + "' and (agencyStatus='Pending' or publisherStatus='Pending')";
 
 
 
   pool.query(sql, function (error, result, field) {
     if (error) {
       log.error("Error in agencyLinkApprove is :" + error);
     }
     else {
       res.send(JSON.stringify(result));
     }
   });
 });
 
 
 /**
  * @author Supriya Gore
  * @param  Description handle  leads update permission
  * @return Description return leads update permission
  */
 router.post("/updateLeadsPermission",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside updateLeadsPermission");
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var updateLeadsTime = req.body.updateLeadsTime;
   var user = req.token;//Somnath Task-3858, Get Token from req.
   var updateLeadsPID = req.body.updateLeadsPID;
   var campID = req.body.campID;
   var status = properties.get('agencyStatus.activeCampaign');
   var completed = properties.get('agencyStatus.completeCampaign');
   var pausedInComplete = properties.get('pubStatus.paused_incomplete');
   var liveInComplete = properties.get('pubStatus.live_incomplete');
   var acceptStatus = properties.get('pubStatus.acceptCampaign');
   var description = propertiesNotification.get('campaign.lead.updateLeadAllowed');
 
   //var description="Update Lead Permission";
 
   var sql = "Update lead_info_status ls join lead_info li on ls.leadInfoID=li.leadInfoID set ls.updateLeadTime='" + updateLeadsTime + "',ls.updateLeadFlag='Yes',ls.lastUpdated='" + formatted + "' WHERE li.pID='" + updateLeadsPID + "'and li.campID='" + campID + "'";
   pool.query(sql, function (error, pubResult, fields) {
     if (error) {
 
       log.error("Error inside updateLeadsPermission ==>" + error);
     }
     else {
 
       var user_role = 'PC';
       var user_role1 = 'AC';
       var userSql = "select ud.userName from user_details ud join email_configuration ec on ud.userID=ec.userID WHERE (ud.orgID='" + updateLeadsPID + "' or ud.orgID='" + user.id + "') and (ud.role='" + user_role + "' or ud.role='" + user_role1 + "') and ec.updateLeadsPermission='" + emailConfigYes + "'";
       pool.query(userSql, function (error, userResult, fields) {
         if (error) {
           log.error("Error inside updateLeadsPermission==>" + error);
 
         }
         else {
           // var userSql1="select userName from user_details  WHERE orgID='"+user.id+"' and role='"+user_role1+"'";
           // pool.query(userSql1,function(error, userResult1, fields) {
           //   if (error) {
           //     log.error("Error inside decrementPublisherLeads 1==>"+error);
 
           //     }
           // else{ 
 
           // var timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
           // var updateLeadsEndTime= DateTime.fromISO(formatted, { zone: timezone });
 
           var timezone = new Date(formatted).getTime();
 
           var finalTimezone = timezone + (updateLeadsTime * 60 * 60 * 1000);
           var updateLeadsEndTime = new Date(finalTimezone);
           email.publisherUpdateLeadPermission(updateLeadsEndTime, updateLeadsTime, userResult, campID, user);
 
           /**
      * @author Narendra Phadke
      * @param  Description handle the Alerts Functionality 
      * @return Description return insert alerts
      */
 
 
           let messageStatus = properties.get('Message.Unread');
           let queryAlerts = "insert into conversation_alerts SET ?",
             values = {
               campID: campID,
               agencyID: user.id,
               pID: updateLeadsPID,
               advertiserID: 0,
               userID: user.userID,
               sender: user.id,
               receiver: updateLeadsPID,
               description: description,
               status: messageStatus,
               created: formatted,
               lastUpdated: formatted
             };
 
           pool.query(queryAlerts, values, function (error, results, fields) {
             if (error) {
               log.error("Alerts inside campaign allowed to update lead publisher Error==" + error);
             } else {
             }
           });
           //       }});
         }
       });
 
       var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + updateLeadsPID + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
       pool.query(sql1, function (err, results, fields) {
         if (err) {
           log.error("Error=" + err);
         }
         else {
         }
       });
 
       res.send(JSON.stringify(pubResult));
       //
     }
 
   })
 
 
 })
 
 /**
 * @author Supriya Gore
 * @param  Description handle the lead update time
 * @return Description return the lead update time
 */
 router.post("/updateLeadsPermissionTimeFlag", authCheck,function (req, res, next) {
   log.info("inside updateLeadsPermissionTimeFlag");
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var user=req.userDecodedInfo;//Sonali-3718-get user object from token
   var status = properties.get('agencyStatus.activeCampaign');
   var pidArray=[];//Sonali-task 3108-to store publisher ID
   var campIDArray=[];//Sonali-task 3108-To store campaign ID
   var conversationDetails=[];//Sonali-task 3108-adding this array to store data in the conversation details table
   var campaignLogDetails=[];//Sonali-task 3108-Adding this array to store data in campaign log table
 
   var description = propertiesNotification.get('campaign.lead.updateLeadDeadline');
 
   //var description="Update Lead Permission";
   var userSql = "select li.campID,ls.lastUpdated,ls.updateLeadTime,li.pID,c.agencyID from lead_info_status ls join lead_info li on ls.leadInfoID=li.leadInfoID join campaign c on c.campID=li.campID WHERE ls.updateLeadFlag='Yes'";
   pool.query(userSql, function (error, leadResult, fields) {
     if (error) {
       log.error("Error inside updateLeadsPermissionTimeFlag==>" + error);
 
     }
     else {
 
       var result = Array.from(new Set(leadResult.map(JSON.stringify))).map(JSON.parse);
       for (var i = 0; i < result.length; i++) {
         (function (j) {
 
           var timezone = new Date(result[j].lastUpdated).getTime();
           var finalTimezone = timezone + (result[j].updateLeadTime * 60 * 60 * 1000);
           var updateLeadsEndTime = new Date(finalTimezone);
           var currentTime = new Date(formatted);
 
         
           if (currentTime >= updateLeadsEndTime) {
            
             pidArray.push(result[j].pID);//Sonali-task 3108-push publisher ID the array
             campIDArray.push(result[j].campID);//Sonali-task 3108-push campaign ID in the array
 
             var receiver;
             if (user.role == "PC") {
               receiver = result[j].agencyID;
             } else {
               receiver = result[j].pID;
             }
                   /**
            * @author Narendra Phadke
            * @param  Description handle the Alerts Functionality 
            * @return Description return insert alerts
            */
               
           let messageStatus = properties.get('Message.Unread');
           //Sonali-task 3108-Store details in the following arrays to insert all in one call in the table
           conversationDetails.push({ "campID": result[j].campID,"agencyID": result[j].agencyID,"pID": result[j].pID,"advertiserID": 0,"userID": user.userID,"sender": user.id,"receiver": receiver,"description": description,"status": messageStatus,"created": formatted,"lastUpdated": formatted})
 
           campaignLogDetails.push({"campID":result[j].campID,"agency_ID":user.id,"pID": result[j].pID,"status":status,"description":description,"user_ID":user.userID,"firstName":user.firstName,"lastName":user.lastName,"created":formatted})
 
             
           }
         })(i);
       }
           if(pidArray.length>0 && campIDArray.length>0){
           //Sonali--task 3108-Putting this query in the comment to pass whole pID and campID array to the sql
            // var sql = "Update lead_info_status ls join lead_info li on ls.leadInfoID=li.leadInfoID set ls.updateLeadFlag='No',ls.lastUpdated='" + formatted + "' WHERE li.pID='" + result[j].pID + "'and li.campID='" + result[j].campID + "'";
            var sql = "Update lead_info_status ls join lead_info li on ls.leadInfoID=li.leadInfoID set ls.updateLeadFlag='No',ls.lastUpdated='" + formatted + "' WHERE li.pID in ('"+pidArray+"') and li.campID in ('" +campIDArray + "')";
 
 
             pool.query(sql, function (error, pubResult, fields) {
               if (error) {
 
                 log.error("Error inside updateLeadsPermissionTimeFlag ==>" + error);
               }
               else {
 
                 // var user_role='PC';
                 // var user_role1='AC';
                 // var userSql="select userName from user_details  WHERE (orgID='"+updateLeadsPID+"' or orgID='"+user.id+"') and (role='"+user_role+"' or role='"+user_role1+"')";
                 //  pool.query(userSql,function(error, userResult, fields) {
                 //     if (error) {
                 //       log.error("Error inside edit end date==>"+error);
 
                 //       }
                 //   else{  
                 // var userSql1="select userName from user_details  WHERE orgID='"+user.id+"' and role='"+user_role1+"'";
                 // pool.query(userSql1,function(error, userResult1, fields) {
                 //   if (error) {
                 //     log.error("Error inside decrementPublisherLeads 1==>"+error);
 
                 //     }
                 // else{ 
 
                 // var timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
                 // var updateLeadsEndTime= DateTime.fromISO(formatted, { zone: timezone });
 
                 //Sonali--task 3108-Insert data in conversation details table
 
                 let keys = Object.keys(conversationDetails[0]);//get keys from rejectedArray
                 let values= conversationDetails.map( obj => keys.map( key => obj[key]));//get value from rejectedArray with mapping key
                 let sql = 'INSERT INTO  conversation_alerts(' + keys.join(',') + ') VALUES ?';//Insert data in lead_info_status
                 // email.publisherUpdateLeadPermission(updateLeadsEndTime,updateLeadsTime,userResult,campID,user);
                 pool.query(sql, [values], function (error, results) {
                   if (error){
                     log.error("Error LeadUpload/BulkInsertRejectedStatus:"+error);
                   }
                 });//End of sql
 
           
                 // let queryAlerts = "insert into conversation_alerts SET ?",
                 //   values = {
                 //     campID: result[j].campID,
                 //     agencyID: result[j].agencyID,
                 //     pID: result[j].pID,
                 //     advertiserID: 0,
                 //     userID: user.userID,
                 //     sender: user.id,
                 //     receiver: receiver,
                 //     description: description,
                 //     status: messageStatus,
                 //     created: formatted,
                 //     lastUpdated: formatted
                 //   };
 
                 // pool.query(queryAlerts, values, function (error, results, fields) {
                 //   if (error) {
                 //     log.error("Alerts inside campaign updateLeadsPermissionTimeFlag Error==" + error);
                 //   } else {
                 //   }
                 // });
                 //       }});
                 // }});
 
                 //Sonali-Insert data in campaign_log  table
 
                 let key1s = Object.keys(campaignLogDetails[0]);//get keys from rejectedArray
                 let value1s= campaignLogDetails.map( obj => key1s.map( key1 => obj[key1]));//get value from rejectedArray with mapping key
                 let sql2 = 'INSERT INTO  campaign_log(' + key1s.join(',') + ') VALUES ?';//Insert data in lead_info_status
                 // email.publisherUpdateLeadPermission(updateLeadsEndTime,updateLeadsTime,userResult,campID,user);
                 pool.query(sql2, [value1s], function (error, results) {
                   if (error){
                     log.error("Error LeadUpload/BulkInsertRejectedStatus:"+error);
                   }
                 });//End of sql
 
                 // var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + result[j].campID + "','" + user.id + "','" + result[j].pID + "','" + status + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
                 // pool.query(sql1, function (err, results, fields) {
                 //   if (err) {
                 //     log.error("Error=" + err);
                 //   }
                 //   else {
                 //   }
                 // });
 
 
                 //
               }
 
             })
           }
     }
   })
   res.json({success:true});//Somnath Task-3858, Send Json response
 })
 
 /**
 * @author Supriya Gore
 * @param  Description handle the lead update time
 * @return Description return the lead update time
 */
 router.post("/updateLeadsCampaign", function (req, res, next) {
   log.info("inside updateLeadsCampaign");
   var pID = req.body.pID;
 
   //var description="Update Lead Permission";
   var userSql = "select li.campID,ls.lastUpdated,ls.updateLeadTime,li.pID,c.agencyID,c.campaignName,pa.startDate,pa.endDate,c.parentCampID,c.reallocationID from lead_info_status ls join lead_info li on ls.leadInfoID=li.leadInfoID join campaign c on c.campID=li.campID join publisher_allocation pa on pa.pID=li.pID and pa.campID=li.campID WHERE ls.updateLeadFlag='Yes' and li.pID='" + pID + "'  group by li.campID order by li.campID desc";
   pool.query(userSql, function (error, leadResult, fields) {
     if (error) {
       log.error("Error inside updateLeadsCampaign==>" + error);
 
     }
     else {
 
       if (leadResult.length > 0) {
         var result = Array.from(new Set(leadResult.map(JSON.stringify))).map(JSON.parse);
         res.send(result);
       }
 
 
 
     }
   })
 })
 
 /**
 * @author Supriya Gore
 * @param  Description handle the lead update time
 * @return Description return the lead update time
 */
 router.post('/downloadExistingLead', function (req, res, next) {
   log.info("inside downloadExistingLead");
   var campID = req.body.campID;
   var parentCampID = req.body.parentCampID;
   var reallocationID = req.body.reallocationID;
   var user = req.body.user;
   var QA_Review = properties.get('download.QA_Review.status');
   var AgencyInternalReview = properties.get('reviewLead.AgencyInternalReview.status');
   var diQAAccepted = properties.get('reviewLead.acceptedDI.status');//Supriya Task:3391 - access DI QA accepted status
   var FinalLeadData = [];
   var finalResult = {};
   var deliverySql = "select d.*,c.multiTouch from delivery_format d join campaign c on d.campID=c.campID WHERE d.campID =?";
   pool.query(deliverySql, [campID],
     function (error, results, fields) {
       if (error) throw error;
 
 
       var deliveryMapSql = "select * from delivery_format_mapping WHERE deliveryCampID ='" + campID + "'";
       pool.query(deliveryMapSql,
         function (error, delFormatMappingResult, fields) {
           if (error) throw error;
 //Supriya Task:3277 - replace key campaignID ascampID
           results = JSON.parse(JSON.stringify(results).split('"campaignID":').join('"campID":'));
           var yesStatus = properties.get('deliveryFormatStatus.yes.status');
 
           //Supriya Task:3277 - declare array campaignArray as json array to set key for download file
           var campaignArray={};
 
           //Supriya Task:3277 - Check condition for every field and set blank value for key
           if(results[0].reAllocationID===yesStatus)
           {
            campaignArray['reAllocationID']="";
           }
           if(results[0].jobLevel===yesStatus)
           {
            campaignArray['jobLevel']="";
           }
           if(results[0].jobFunction===yesStatus)
           {
            
             campaignArray['jobFunction']="";
           }
            
           if(results[0].industry===yesStatus)
           {
            
             campaignArray['industry']="";
           }
     
           if(results[0].companyEmployeeSize===yesStatus)
           {
            
             campaignArray['companyEmployeeSize']="";
           }
     
           if(results[0].street===yesStatus)
           {
             campaignArray['street']="";//Supriya Task:3391 - change Street to lower case as per table column
           }
          
           if(results[0].companyRevenue===yesStatus)
           {
            
             campaignArray['companyRevenue']="";
           }
           
           if(results[0].ip===yesStatus)
           {
             campaignArray['ip']="";
           }
           if(results[0].supportDocID===yesStatus)
           {
             campaignArray['supportDocID']="";//Supriya, Task:3391 - supportDocID set to blank
           }
           if(results[0].callAudit==='Yes')
           {
             campaignArray['voiceLogLink']="";
           }
          
           
           // for(var i=0;i<questionResult.length;i++)
           // {
           //   var question='customQuestion'+(i+1);
           //   campaignArray[question]="";
           // }
     
           if(results[0].extra1===yesStatus)
           {
             campaignArray['extra1']="";
           }
           if(results[0].extra2===yesStatus)
           {
             campaignArray['extra2']="";
           }
           if(results[0].extra3===yesStatus)
           {
             campaignArray['extra3']="";
           }
           if(results[0].extra4===yesStatus)
           {
             campaignArray['extra4']="";
           }
           if(results[0].extra5===yesStatus)
           {
             campaignArray['extra5']="";
           }

           //Supriya Task:3391 - Extra6 to Extra20 Fields added
           if (results[0].extra6 === yesStatus) {
            campaignArray['extra6'] = "";
          }
          if (results[0].extra7 === yesStatus) {
            campaignArray['extra7'] = "";
          }
          if (results[0].extra8 === yesStatus) {
            campaignArray['extra8'] = "";
          }
          if (results[0].extra9 === yesStatus) {
            campaignArray['extra9'] = "";
          }
          if (results[0].extra10 === yesStatus) {
            campaignArray['extra10'] = "";
          }
          if (results[0].extra11 === yesStatus) {
            campaignArray['extra11'] = "";
          }
          if (results[0].extra12 === yesStatus) {
            campaignArray['extra12'] = "";
          }
          if (results[0].extra13 === yesStatus) {
            campaignArray['extra13'] = "";
          }
          if (results[0].extra14 === yesStatus) {
            campaignArray['extra14'] = "";
          }
          if (results[0].extra15 === yesStatus) {
            campaignArray['extra15'] = "";
          }
          if (results[0].extra16 === yesStatus) {
            campaignArray['extra16'] = "";
          }
          if (results[0].extra17 === yesStatus) {
            campaignArray['extra17'] = "";
          }
          if (results[0].extra18 === yesStatus) {
            campaignArray['extra18'] = "";
          }
          if (results[0].extra19 === yesStatus) {
            campaignArray['extra19'] = "";
          }
          if (results[0].extra20 === yesStatus) {
            campaignArray['extra20'] = "";
          }
          
           if(results[0].domain===yesStatus)
           {
             campaignArray['domain']="";
           }
           if(results[0].alternatePhoneNo===yesStatus)
           {
             campaignArray['alternatePhoneNo']="";
           }
           if(results[0].linkedIn===yesStatus)
           {
             campaignArray['linkedIn']="";
           }
           if(results[0].comments===yesStatus)
           {
             campaignArray['comments']="";
           }
     
           if(results[0].multiTouch===yesStatus)
           {
             delete campaignArray["Asset Name"];
     
             //Supriya Task:3277 - execute query for check campID is multitouch
             var sql="select supportDocID,suppDocName,campID,typeOfSuppDoc,multiTouch from supporting_document where campID='"+campID+"'and typeOfSuppDoc='Asset' and (status!='Removed' or status is null)"
             var multiTouchAsset="";
             pool.query(sql,function(err,resultsAsset,fields){
               if(err){
                log.error("error inside diQARole/downloadLeadDetails===>"+err)
             }
               else{
     
                 var assetTouch1="",assetTouch2="",assetTouch3="";
                 //Supriya Task:3277 - unescape asset base on multitouch condition that 1st touch, 2nd touch ot 3rd touch
                 for(var i=0;i<resultsAsset.length;i++)
               {
                 if(resultsAsset[i].multiTouch=="1st Touch"){
                   assetTouch1=assetTouch1+"|"+unescape(resultsAsset[i].suppDocName);
                 }
                 if(resultsAsset[i].multiTouch=="2nd Touch"){
     
                   assetTouch2=assetTouch2+"|"+unescape(resultsAsset[i].suppDocName);
     
                 }
                 if(resultsAsset[i].multiTouch=="3rd Touch"){
     
                   assetTouch3=assetTouch3+"|"+unescape(resultsAsset[i].suppDocName);
     
                 }
                 multiTouchAsset=multiTouchAsset+"|"+resultsAsset[i].multiTouch;
     
               }
            //Supriya Task:3277 - get only number from multitouch
               var onlyNum=(multiTouchAsset.match(/\d+/g).map(Number)).toString();
               onlyNum=onlyNum.split(',');
               var maxNum=Math.max(...onlyNum);
              //Supriya Task:3277 - add key for header in download file base on multitouch number
               if(maxNum===3){
                 three=true;
                 campaignArray['assetNameTouch1']="";
               campaignArray['assetTimestampTouch1']="";
               campaignArray['assetNameTouch2']="";
               campaignArray['assetTimestampTouch2']="";
               campaignArray['assetNameTouch3']="";
               campaignArray['assetTimestampTouch3']="";
     
               //campaignArray['assetName']="";
     
                
               }
               if(maxNum===2){
               campaignArray['assetNameTouch1']="";
               campaignArray['assetTimestampTouch1']="";
               campaignArray['assetNameTouch2']="";
               campaignArray['assetTimestampTouch2']="";
              
               //campaignArray['assetName']="";
                 two=true;
                
               }
               if(maxNum===1){
                 campaignArray['assetNameTouch1']="";
                 campaignArray['assetTimestampTouch1']="";
                
                // campaignArray['assetName']="";
                 one=true;
                
               }
               
             }
           });   
           }
           else{
             campaignArray['assetName']="";
     
           }
           setTimeout(function(){
           let keys = Object.keys(campaignArray);//Supriya Task:3277 - extract keys from campaign array
           //Supriya Task:3277 - get lead deatils to update
           //Supriya Task:3391 - get campaign name and add status DI QA Accepted in where clause
           var leadSql = "select li.leadInfoID,li.campID,c.campaignName,li.pID,li.leadInteractionDate,li.firstName,li.lastName,li.email,li.companyName,li.linkedInCompanyName,li.workPhone,li.jobTitle,li.linkedInJobTitle,li.address,li.country,li.city,li.state,li.zipCode,li.companyEmployeeSize,li.industry,li."+keys.join(',li.')+",ls.status,lr.reason from lead_info li join lead_info_status ls on li.leadInfoID=ls.leadInfoID left join lead_info_reason lr ON li.leadInfoID=lr.leadInfoID join campaign c on li.campID=c.campID where li.campID='" + campID + "' and li.pID='" + user.id + "' and ls.status IN ('" + QA_Review + "','" + AgencyInternalReview + "', '"+ diQAAccepted +"')";
 
           pool.query(leadSql, function (error, leadResults, fields) {
             if (error) {
               log.error("Error inside downloadExistingLead==>" + error);
               throw error;
             } else {
               //Supriya Task:3277 - decrypy and unescape every field for that lead
               for (var i = 0; i < leadResults.length; i++) {
                 leadResults[i].assetName = unescape(leadResults[i].assetName);
                 
                 var email = leadResults[i].email;
                 if (email.includes("@") == false) {
                   leadResults[i].email = cryptr.decrypt(leadResults[i].email);
                   leadResults[i].firstName = cryptr.decrypt(leadResults[i].firstName);
                   leadResults[i].lastName = cryptr.decrypt(leadResults[i].lastName);
                   leadResults[i].workPhone = cryptr.decrypt(leadResults[i].workPhone);
                 }
                 if (leadResults[i].hasOwnProperty('assetNameTouch1')) {
                   let touch1 = "assetNameTouch1";
                   leadResults[i][touch1] = unescape(leadResults[i][touch1]);
                 }
                 if (leadResults[i].hasOwnProperty('assetNameTouch2')) {
                   let touch2 = "assetNameTouch2";
                   leadResults[i][touch2] = unescape(leadResults[i][touch2]);
                 }
                 if (leadResults[i].hasOwnProperty('assetNameTouch3')) {
                   let touch3 = "assetNameTouch3";
                   leadResults[i][touch3] = unescape(leadResults[i][touch3]);
                 }
                 
               }
               //Supriya Task:3277 - get custom question for that campaign
               var sql = "select lq.customQuestion,lq.answer,lq.leadInfoID from lead_custom_questions lq join lead_info_status ls on lq.leadInfoID=lq.leadInfoID join campaign c on lq.campID=c.campID where lq.campID='" + campID + "' and lq.pID='" + user.id + "' and ls.status='" + QA_Review + "'";
 
               pool.query(sql, function (error, customQuesResults, fields) {
                 if (error) {
                   log.error("Error inside downloadExistingLead==>" + error);
                   throw error;
                 }
                //Supriya Task:3277 - using common function for lead key change as per mapping
              new Promise(async (reject) => {
               //Supriya Task:3277 - add try/catch block to call function
               try {
                 if(leadResults.length>0){
                   //Supriya Task:3277 - use async/await function for wait still get result
                   var role = "PC";
                   leadResults = await uploadLeadFunction.leadDownloadFunction(leadResults, delFormatMappingResult, results, customQuesResults, role);
                   res.send(JSON.stringify(leadResults));
                 } else {
                     var success = "No Data Exists";
                     res.json({ success: true, message: success });
                   }
               } catch (error) { reject(error) }//End of catch block
             })//End of Promise
                 //pool.end();
               })
             }
           });
      },2000)
         });
     });
 });
 
 function merge(array, key) {
   var r = [],
     hash = Object.create(null);
 
   array.forEach(function (a) {
     a.forEach(function (o) {
       if (!hash[o[key]]) {
         hash[o[key]] = {};
         r.push(hash[o[key]]);
       }
       Object.keys(o).forEach(function (k) {
         hash[o[key]][k] = o[k];
       });
     });
   });
   return r;
 
 }
 
 /**
   * @author Somnath Keswad
   * @param  Description Cancel the lead which are uploaded by publisher as per condition
   * @return Description return Successfully response.
   */
 router.post("/cancelAfterLeadSubmission",authCheck, function (req, res, next) {//Somnath Task:2993, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
   log.info("inside cancelAfterLeadSubmission");
   var errors;
   var pID = req.body.pID;
   var campID = req.body.campID;
   var allocatedLeads = req.body.allocatedLeads;
   var user = req.token;
   var acceptChecked = req.body.accepted;
   var ClientAccepted_Checked = req.body.ClientAccepted;
   var acceptedLeads = parseInt(req.body.acceptedLeads);
   var clientAcceptedLeads = parseInt(req.body.clientAcceptedLeads);
   var reason = req.body.reason;
   if (reason == undefined) { reason = ''; }
   var description=campaignTraceProperties.get('campaign.cancel.leadUpload');//Sonali-3257-get details from properties file
   
   var dt = dateTime.create();
   var formatted = dt.format("Y-m-d H:M:S");
   var pubAccetStatus = properties.get('pubStatus.acceptCampaign');
   var leadStatus = properties.get('reviewLead.accepted.status');
   var QA_Review = properties.get('download.QA_Review.status');
   var accepted = properties.get('download.accepted.status');
   var clientAccepted = properties.get('clientReviewLead.clientAccepted.status');
   var agencyInternalReview = properties.get('reviewLead.leads.agencyInternalReview');
   var cancelALU = properties.get('publisher.cancelALU_Publisher');
   var active = properties.get('activeCampaign.partialAllocation');
   var allocatingInProgress = properties.get('agencyStatus.partialAllocation');
   var whereCondition = '';
   var acceptedLeadAllocation;
   if (acceptChecked == true && ClientAccepted_Checked == false) {
     whereCondition = "where (lis.status='" + accepted + "' or lis.status='" + QA_Review + "' or lis.status='" + agencyInternalReview + "' or lis.status='InternalReview')";
     acceptedLeads = 0;
   } else if (acceptChecked == false && ClientAccepted_Checked == true) {
     whereCondition = "where ( lis.status='" + clientAccepted + "' or lis.status='" + QA_Review + "' or lis.status='" + agencyInternalReview + "' or lis.status='InternalReview')";
     clientAcceptedLeads = 0;
   } else if (acceptChecked == true && ClientAccepted_Checked == true) {
     whereCondition = "where (lis.status='" + clientAccepted + "' or lis.status='" + accepted + "' or lis.status='" + QA_Review + "' or lis.status='" + agencyInternalReview + "' or lis.status='InternalReview')";
     acceptedLeads = 0;
     clientAcceptedLeads = 0;
   } else {
     whereCondition = "where (lis.status='" + QA_Review + "' or lis.status='" + agencyInternalReview + "' or lis.status='InternalReview')";
   }
   acceptedLeadAllocation = acceptedLeads + clientAcceptedLeads;
   var sql = "select li.leadInfoID, li.campID,li.pID,li.email,lis.status from lead_info li join lead_info_status lis on li.leadInfoID=lis.leadInfoID and li.campID='" + campID + "' and li.pID='" + pID + "' " + whereCondition + " ";
   pool.query(sql, function (error, leadData, fields) {
     if (error) {
       log.error("Error inside getAccpetedForCancelPublisher==>" + error);
       return res.status(400).json(errors);
     }
     else {
 
       for (var i = 0; i < leadData.length; i++) {
         (function (j) {
           var leadInfoID = leadData[j].leadInfoID;
           var leadEmail = leadData[j].email;
           var updateLead = "update lead_info li join lead_info_status lis on li.leadInfoID=lis.leadInfoID set lis.status='Rejected',li.lastUpdated='" + formatted + "' where li.campID='" + campID + "' and li.pID='" + pID + "' and li.leadInfoID='" + leadData[j].leadInfoID + "'";
           pool.query(updateLead, function (error, leadData, fields) {
             if (error) {
               log.error("Error Inside cancelAfterLeadSubmission==>" + error);
             }
             else {
               var insertReason = "insert into lead_info_reason(leadInfoID,email,reason,created) values('" + leadInfoID + "','" + leadEmail + "','" + reason + "','" + formatted + "')";
               pool.query(insertReason, function (error, leadData, fields) {
                 if (error) {
                   log.error("Error Inside cancelAfterLeadSubmission==>" + error);
                 }
               });
             }
           });
         })(i);
       }
       // }// End of if
 
       var updateAl = "UPDATE campaign c, publisher_allocation pa SET pa.allocatedLead='" + acceptedLeadAllocation + "',pa.status ='" + cancelALU + "',c.status='" + allocatingInProgress + "',pa.lastUpdated='" + formatted + "' WHERE c.campID=pa.campID and c.campID='" + campID + "' and pa.pID='" + pID + "'";
       pool.query(updateAl, function (error, results, fields) {
         if (error) {
           log.error("Error inside getAccpetedForCancelPublisher update query==>" + error);
         }
         else {
 
           var getPacing = "select pc.campID,pc.pubPacingID,pc.pacingMonth,pc.pacingUnit,pc.pacingPercentage,pc.pacingLeadCount,pc.pacingEndDate,pc.pacingCarryForward,pc.carryLeadCount,pc.carryLeadCountNo,c.startDate from publisher_pacing pc join campaign c on pc.campID=c.campID where pc.campID='" + campID + "' and pc.pID='" + pID + "' order by pc.pacingEndDate asc";
 
           pool.query(getPacing, function (error, pacingCampResult, fields) {
             if (error) {
               log.error("Error in cancel publisher pacing=" + error);
               return res.status(400).json(errors);
             } else {
 
               for (var d = 0; d < pacingCampResult.length; d++) {
                 (function (s) {
                   pacingCampResult[s].pacingAcceptedLead = 0;
 
                   var pacingLeadSql;
                   if (s == 0) {
                     pacingLeadSql = "select li.campID,Sum(CASE WHEN lis.status = '" + accepted + "' OR lis.status='" + clientAccepted + "'  THEN 1 ELSE 0 END) as pacingAcceptedLead from lead_info li join lead_info_status lis on li.leadInfoID=lis.leadInfoID where li.pID='" + pID + "' and campID='" + campID + "' and (li.lastUpdated between '" + pacingCampResult[s].startDate + "' and '" + pacingCampResult[s].pacingEndDate + "')";
 
                   } else {
                     pacingLeadSql = "select li.campID,Sum(CASE WHEN lis.status = '" + accepted + "' OR lis.status='" + clientAccepted + "'  THEN 1 ELSE 0 END) as pacingAcceptedLead from lead_info li join lead_info_status lis on li.leadInfoID=lis.leadInfoID where li.pID='" + pID + "' and campID='" + campID + "' and (li.lastUpdated between '" + pacingCampResult[s - 1].pacingEndDate + "' and '" + pacingCampResult[s].pacingEndDate + "')";
 
                   }
 
                   pool.query(pacingLeadSql, function (err, pacingLeadResult, fields) {
                     if (err) {
                       log.error("Error pacingCampaignDetails==>" + err);
                     }
                     else {
 
                       if (pacingLeadResult[0].pacingAcceptedLead == null || pacingLeadResult[0].pacingAcceptedLead == 'null') {
                         pacingLeadResult[0].pacingAcceptedLead = 0;
                       }
                       var cancelLeads;
 
                       cancelLeads = pacingLeadResult[0].pacingAcceptedLead;
 
                       var pacingCancelALU = "update publisher_pacing set cancelLeads='" + cancelLeads + "',status='" + cancelALU + "',lastUpdated='" + formatted + "' where pubPacingID='" + pacingCampResult[s].pubPacingID + "'";
 
                       pool.query(pacingCancelALU,
                         function (error, pacingCancelALUResult, fields) {
                           if (error) {
                             log.error("Error inside pacingCancelALU count==>" + error);
                             return res.status(400).json(errors);
                           } else {
                             log.info("pacingCancelALU count Updated");
                           }
                         })
 
 
                     }
                   })
 
 
                 })(d)
               }
             }
           })
           var sql1 = "insert into campaign_log (campID,agency_ID,pID,status,description,user_ID,firstName,lastName,created)values('" + campID + "','" + user.id + "','" + pID + "','" + cancelALU + "','" + description + "','" + user.userID + "','" + user.firstName + "','" + user.lastName + "','" + formatted + "')";
           pool.query(sql1, function (err, results, fields) {
             if (err) {
               log.error("Error=" + err);
             }
           });
           var user_role = 'PC';
           var user_role1 = 'AC';
           var userSql = "select ud.userName,ud.firstName,ud.lastName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE ud.orgID='" + pID + "' and role='" + user_role + "'  and ec.cancelPublisher='" + emailConfigYes + "'";
           pool.query(userSql, function (error, userResult, fields) {
             if (error) {
               log.error("Error Publisher/cancelAfterLeadSubmission" + error);//Somnath task:2993,add missing error
             }
             else {
               var userSql1 = "select ud.userName,ud.firstName,ud.lastName from user_details ud join email_configuration ec on ud.userID=ec.userID  WHERE (ud.orgID='" + user.id + "' and ud.role='" + user_role1 + "' and ec.cancelPublisher='" + emailConfigYes + "')";
               pool.query(userSql1, function (error, userResult1, fields) {
                 if (error) {
                   log.error("Error Publisher/cancelAfterLeadSubmission" + error);//Somnath task:2993, add error
                 }
                 else {
                   // for IO PDF generation.
                   var allocationID = '';
                   var agencyID = user.id;
                   let firstName="",lastName='';//Somnath task:2993, check undifined or null
                   if(userResult.length>0){
                     firstName=userResult[0].firstName;
                     lastName=userResult[0].lastName;
                   }
                   var userData = { firstName, lastName}
                   setTimeout(function () {
                     GenerateIO.generateIODocument(res, allocationID, pID, campID, userData, agencyID);
                   }, 3000);
                   var result = userResult.concat(userResult1);
                   email.publisherCancel(result, campID, user);
 
                   let description = propertiesNotification.get('campaign.cancel.notification');
                   let messageStatus = properties.get('Message.Unread');
                   let queryAlerts = "insert into conversation_alerts SET ?",
                     values = {
                       campID: campID,
                       agencyID: user.id,
                       pID: pID,
                       advertiserID: 0,
                       userID: user.userID,
                       sender: user.id,
                       receiver: pID,
                       description: description,
                       status: messageStatus,
                       created: formatted,
                       lastUpdated: formatted
                     };
                   pool.query(queryAlerts, values, function (error, results, fields) {
                     if (error) {
                       log.error("Alerts inside campaign cancel to publisher allocation Error==" + error);
                     }
                   });
                 }
               })// Get User Detail of Agency
             }
           })// Get User Detail of Publisher
           var data = [{ success: true, campID: campID }]
           res.send(JSON.stringify(data));
         }
       });// End of Update Publisher Allocation 
       // res.send(JSON.stringify(resultInBoolean));
     }
   });// End of first
 });
 
 //Somnath Task-3761, Add router auth middleware
 router.post("/getAllocatedLeadsForPub", authCheck,function (req, res, next) {
 
   log.info("inside publisher/getAllocatedLeadsForPub");
   var campID = req.body.campID;
   var pID = req.body.pID;
   //sum(CASE WHEN pa.status='Accept' THEN pa.allocatedLead ELSE 0 END )
   var sql = "select c.campID,p.pID,p.publisherName, pa.allocatedLead from publisher p join publisher_allocation pa on p.pID=pa.pID join campaign c on pa.campID=c.campID where c.campID='" + campID + "' and pa.status='Accept'  and pa.pID='" + pID + "'";
 
 
   pool.query(sql, function (err, result, fields) {
     if (err) {
       log.info("Error inside publisher/getAllocatedLeadsForPub===>" + err)
     }
     else {
       res.send(JSON.stringify(result))
     }
   });
 
 });
 //Somnath Task-3761, Add router auth middleware
 router.post("/getPublisherList",authCheck, function (req, res, next) {
 
   log.info("inside publisher/getPublisherList");
   var campID = req.body.campID;
   var pID = req.body.pID;
 
   var sql = "select c.campID,pa.allocationID,p.pID,p.publisherName,sum(CASE WHEN pa.status='Accept' THEN pa.allocatedLead ELSE 0 END ) As allocatedLead from publisher p join publisher_allocation pa on p.pID=pa.pID join campaign c on pa.campID=c.campID where c.campID='" + campID + "' and pa.status='Accept'  group by pID";
 
 
   pool.query(sql, function (err, result, fields) {
     if (err) {
       log.info("Error inside publisher/getPublisherList===>" + err)
     }
     else {
       res.send(JSON.stringify(result))
     }
   });
 
 });
 
 /**
 * @author Sonali
 * @param  Description  get publisher details
 * @return Description return successfully returns publisher information
 */
 router.post('/publisherDetails', authCheck,function (req, res, next) {  //Priyanka--3944--added authcheck
   log.info("inside publisherDetails");
   var pID = req.token.id;   //Priyanka--3944--accessing id from token
 
   var errors;
   var query = "SELECT p.pID,p.publisherName,p.email,p.website,p.phone,p.country,p.state,p.city,p.zipcode,p.timezone,p.countryCode,p.address,p.rating,p.gdprCompliance,p.dcEmail,p.dcTelemarketing,p.dcDisplay,p.dcProgrammatic,p.dcSocial,p.logoName,bi.bankName,bi.accountNumber,bi.accountHolderName,bi.ifscCode,bi.panNumber,bi.gstNumber from publisher p left join bank_info bi on p.pID=bi.orgID where p.pID='" + pID + "'";
 
 
   pool.query(query, function (error, results, fields) {
     if (error) {
       log.error("Error in publisherDetails=" + error);
       return res.status(400).json(errors);
     } else {
       log.info("inside publisherDetails sql==>" + query);
 
       res.send(JSON.stringify(results));
     }
   });
 
 
 });
 
 
 /**
 * @author Sonali
 * @param  Description  get publisher details
 * @return Description return publisher details of contact
 */
 router.post('/publisherContactDetails',authCheck, function (req, res, next) {    //Priyanka--3944--added authcheck
   log.info("inside agenpublisherContactDetailscyContactDetails");
   var pID = req.token.id;   //Priyanka-3944--accessing id from token
   var errors;
   var query = "SELECT ci.contactID,ci.firstName,ci.lastName,ci.designation,ci.email,ci.countryPhoneCode,ci.phoneNo,ci.role from contact_info ci where ci.orgID='" + pID + "'";
 
   //query=mysql.escape(query);
   pool.query(query, function (error, results, fields) {
     if (error) {
       log.error("Error in publisherContactDetails=" + error);
       return res.status(400).json(errors);
     } else {
       log.info("inside publisherContactDetails sql==>" + query);
 
       res.send(JSON.stringify(results));
     }
   });
 
 
 });
 
 
 
 /**
  * @author Sonali
  * @param  Description  edit publisher bank details on publisher information page
  * @return Description return successfully response with message
  */
 router.post("/editPublisherBankInfo",authCheck, function (req, res, next) {    //Priyanka--3944--added authCheck
   log.info("inside Edit publisher bank info");
   let bankDetails = [];
   bankDetails = req.body.bankDetails;
 
   var bankName = bankDetails[0].bankName;
   var accountNumber = bankDetails[0].accountNumber;
   var accountHolder = bankDetails[0].accountHolderName;
   var ifscCode = bankDetails[0].ifscCode;
   var panNumber = bankDetails[0].panNumber;
   var gstNumber = bankDetails[0].gstNumber;
   var pID = bankDetails[0].pID;
 
 
   var getPubDetails = "select * from bank_info where orgID='" + pID + "'";
   pool.query(getPubDetails, function (error, result, fields) {
     if (error) {
       log.error("Error===>" + error)
     }
     else {
       if (result.length > 0) {
 
         var updateBankInfo = "update bank_info set ? where orgID='" + pID + "'",
           valuesForBank = {
             bankName: bankName,
             accountNumber: accountNumber,
             accountHolderName: accountHolder,
             ifscCode: ifscCode,
             panNumber: panNumber,
             gstNumber: gstNumber,
             lastUpdated: formatted
           }
 
         pool.query(updateBankInfo, valuesForBank, function (err, resultBank, fields) {
           if (err) {
             log.error("error in===>" + err)
           }
           else {
             res.send({ "success": true })
           }
         });
 
       }
       else {
         //publisher bank info does not exists
 
         var insertBankInfo = "insert into bank_info set ? ",
           valuesForBank = {
             orgID: pID,
             bankName: bankName,
             accountNumber: accountNumber,
             accountHolderName: accountHolder,
             ifscCode: ifscCode,
             panNumber: panNumber,
             gstNumber: gstNumber,
             status: 'Step4',
             created: formatted,
             lastUpdated: formatted
           }
 
         pool.query(insertBankInfo, valuesForBank, function (err, resultBank, fields) {
           if (err) {
             log.error("error in===>" + err)
           }
           else {
             res.send({ "success": true })
           }
         });
 
       }
     }
   });
 
 
 });
 
 /**
  * @author Sonali
  * @param  Description  edit publisher details on publisher information page
  * @return Description return successfully response with message
  */
 router.post("/editPublisherInfo", authCheck,function (req, res, next) {   //Priyanka--3944--added authCheck
   log.info("inside Edit publisher info");
   let userInfo = []
   var flag = '';
   userInfo = JSON.parse(req.body.pubInfo);
   var pID = userInfo[0].pID;
   var publisherName = userInfo[0].publisherName;
   var userEmail = userInfo[0].email;
   var website = userInfo[0].website;
   var countryCode = userInfo[0].countryCode;
   var phone = userInfo[0].phone;
   var country = userInfo[0].country;
   var state = userInfo[0].state;
   if (state == "undefined" || !state) { state = "" }
 
   var city = userInfo[0].city;
   var zipcode = userInfo[0].zipcode;
   if (zipcode == "undefined" || !zipcode) { zipcode = "" }
 
   var timezone = userInfo[0].timezone;
   var address = userInfo[0].address;
   var rating = userInfo[0].rating;
   var gdprCompliance = userInfo[0].gdprCompliance;
   var channelEmail = userInfo[0].dcEmail;
   var channelTelemarketing = userInfo[0].dcTelemarketing;
   var channelDisplay = userInfo[0].dcDisplay;
   var channelProgramatic = userInfo[0].dcProgrammatic;
   var channelSocial = userInfo[0].dcSocial;
 
   let pubContact1 = [];
   pubContact1 = JSON.parse(req.body.pubContact1);
   var contactID = pubContact1[0].contactID;
   var firstName = pubContact1[0].firstName;
   var lastName = pubContact1[0].lastName;
   var designation = pubContact1[0].designation;
   var contactEmail = pubContact1[0].email;
   var countryPhoneCode = pubContact1[0].countryPhoneCode;
   var phoneNumber = pubContact1[0].phoneNo;
 
 
   let pubContact2 = [];
   pubContact2 = JSON.parse(req.body.pubContact2);
 
   if (pubContact2.length > 0) {
     var contactID2 = pubContact2[0].contactID;
     var firstName2 = pubContact2[0].firstName;
     var lastName2 = pubContact2[0].lastName;
     var designation2 = pubContact2[0].designation;
     var contactEmail2 = pubContact2[0].email;
     var countryPhoneCode2 = pubContact2[0].countryPhoneCode;
     var phoneNumber2 = pubContact2[0].phoneNo2;
   }
 
   if (req.body.fileUploadFlag == "true") {
     var file = [];
     file = req.files.fileName;
     var fileContents = file.data;
     var logoName = file.name;
   }
 
 
   //if(pID!=undefined||pID!="undefined"||pID!=null||pID!="null"||pID!=""){
   var sql = "update publisher set ? where pID='" + pID + "'";
 
   if (req.body.fileUploadFlag == "true") {
     values = {
       publisherName: publisherName,
       timezone: timezone,
       email: userEmail,
       website: website,
       phone: phone,
       logoName: logoName,
       logo: fileContents,
       rating: rating,
       gdprCompliance: gdprCompliance,
       country: country,
       state: state,
       city: city,
       zipcode: zipcode,
       countryCode: countryCode,
       address: address,
       lastUpdated: formatted,
       dcEmail: channelEmail,
       dcTelemarketing: channelTelemarketing,
       dcDisplay: channelDisplay,
       dcProgrammatic: channelProgramatic,
       dcSocial: channelSocial
     }
   }
   else {
     values = {
       publisherName: publisherName,
       timezone: timezone,
       email: userEmail,
       website: website,
       phone: phone,
       //logoName:logoName,
       //logo:fileContents,
       rating: rating,
       gdprCompliance: gdprCompliance,
       country: country,
       state: state,
       city: city,
       zipcode: zipcode,
       countryCode: countryCode,
       address: address,
       lastUpdated: formatted,
       dcEmail: channelEmail,
       dcTelemarketing: channelTelemarketing,
       dcDisplay: channelDisplay,
       dcProgrammatic: channelProgramatic,
       dcSocial: channelSocial
     }
   }
 
   pool.query(sql, values, function (error, result, fields) {
     if (error) {
       log.error("Error= " + error);
       return res.status(400).json(errors);
     }
     else {
       var contactInfo = "update contact_info set ? where orgID='" + pID + "' and contactID='1'",
         valuesForContact = {
           firstName: firstName,
           lastName: lastName,
           designation: designation,
           email: contactEmail,
           countryPhoneCode: countryPhoneCode,
           phoneNo: phoneNumber,
           lastUpdated: formatted
 
         }
       pool.query(contactInfo, valuesForContact, function (error, resultContact, fields) {
         if (error) {
           log.error("error is---->" + error)
         }
         else {
           res.send({ "success": true })
         }
       })
 
       if (pubContact2.length > 0) {
 
         var getPubInfo = "select * from contact_info where orgID='" + pID + "' and contactID='2'";
 
         pool.query(getPubInfo, function (error1, result1, fields) {
           if (result1.length > 0) {
             //publisher contact into 2 already exists
 
             var contactInfo2 = "update contact_info set ? where orgID='" + pID + "' and contactID='2'",
               valuesForContact2 = {
                 firstName: firstName2,
                 lastName: lastName2,
                 designation: designation2,
                 email: contactEmail2,
                 countryPhoneCode: countryPhoneCode2,
                 phoneNo: phoneNumber2,
                 lastUpdated: formatted
 
               }
             pool.query(contactInfo2, valuesForContact2, function (error2, resultContact2, fields) {
               if (error2) {
                 log.error("error is---->" + error2)
               }
               else {
                 flag = true;
               }
             })
           }
           else {
             //contact info for ID 2 added
             var contactInfo2 = "insert into  contact_info set ?",
               valuesForContact2 = {
                 orgID: pID,
                 contactID: '2',
                 firstName: firstName2,
                 lastName: lastName2,
                 designation: designation2,
                 email: contactEmail2,
                 countryPhoneCode: countryPhoneCode2,
                 phoneNo: phoneNumber2,
                 lastUpdated: formatted
 
               }
             pool.query(contactInfo2, valuesForContact2, function (error2, resultContact2, fields) {
               if (error2) {
                 log.error("error is---->" + error2)
               }
               else {
                 flag = true;
               }
             })
           }
         });
 
 
       }
 
 
     }
   });
   if (flag == true) {
     res.send({ "success": true })
   }
   //}
 
 });
 
 
 /**
  * @author Sonali
  * @param  Description  edit publisher gdpr details on publisher information page
  * @return Description return successfully response with message
  */
 
 router.post("/getGDPRInfoForEdit", authCheck,function (req, res, next) {  //Priyanka--3944--added authCheck
 
   var pID = req.token.id;   //Priyanka-3944- accessing id from token
 
   var getInfo = "select docID,orgID,complianceID,qID,answer,documentName,created from compliance_details where orgID='" + pID + "'";
   pool.query(getInfo, function (err, result, fields) {
     if (err) {
       log.info("Error inside publisher/getGDPRInfoForEdit");
     }
     else {
       function SortByID(x, y) {
         return x.qID - y.qID;
       }
       result.sort(SortByID);
 
       res.send(JSON.stringify(result))
     }
   });
 });
 
 
 
 /* @author Sonali Kalke
 * @param  Description get voice log link from database
 * @return
 */
 router.get("/getVoiceLogLink", function (req, res, next) {
   log.info("publisher/getVoiceLogLink")
   var leadInfoID = url.parse(req.url, true).query.leadInfoID;
   var sql = "select voiceLogLink from lead_info where leadInfoID='" + leadInfoID + "'";
   pool.query(sql, function (err, result, fields) {
     if (err) {
       log.error("error inside lead/getVoiceLogLink");
     }
     else {
       res.send(JSON.stringify(result));
     }
   });
 
 });
 
 
 /**
  * @author Sonali
  * @param  Description  when publisher submits creatives status changes from waitingFromSubmit to agencyReviewPending
  * @return 
  */
 
 router.post("/updateStatus", function (req, res, next) {
   var campID = req.body.campID;
 
   var sql = "select id from poc_details where campID='" + campID + "'";
   pool.query(sql, function (err, result, fields) {
     if (err) {
       log.info("error inside publisher/updateStatus===>" + err)
     }
     else {
       if (result.length > 0) {
         for (var i = 0; i < result.length; i++) {
           var updateQuery = "update poc_details set status='AgencyReviewPending' where id='" + result[i].id + "'";
           pool.query(updateQuery, function (error1, resultUpdate, fields) {
             if (error1) {
               log.info("error inside publisher/updateStatus===>" + error1)
 
             }
             else {
             }
           })
         }
       }
     }
   })
 
 
   var sqlCS = "select id from call_script_details where campID='" + campID + "'";
   pool.query(sqlCS, function (errCS, resultCS, fields) {
     if (errCS) {
       log.info("error inside publisher/updateStatus===>" + err)
     }
     else {
       if (resultCS.length > 0) {
 
         for (var i = 0; i < resultCS.length; i++) {
           var updateQueryCS = "update call_script_details set status='AgencyReviewPending' where id='" + resultCS[i].id + "'";
           pool.query(updateQueryCS, function (error1, resultUpdateCS, fields) {
             if (error1) {
               log.info("error inside publisher/updateStatus===>" + error1)
 
             }
             else {
             }
           })
         }
       }
     }
   })
 })
 
 /**
  * @autor Sonali -Task 3176
  * @description display pacing details publisher wise on agencyAllocated page
  * @returns pacing details of perticular publisher
 */
//Somnath Task-3858, Add checkAuth middleware
 router.post("/getPacingDetailsForPublisher",authCheck,function(req,res,next){
   log.info("inside getPacingDetailsForPublisher");
   var pID=req.body.pID;
   var campID=req.body.campID;
 
   var sql="select campID,pID,pacingMonth,pacingUnit,pacingPercentage,pacingLeadCount,pacingEndDate,pacingCarryForward,carryLeadCount,carryLeadCountNo,leadCountAllocation,cancelLeads,status,created from publisher_pacing where campID='"+campID+"' and pID='"+pID+"'";
 
   pool.query(sql,function(err,result,fields){
     if(err){
       log.error("Error inside publisher/getPacingDetailsForPublisher==>"+err);
     }
     else{
       res.send(JSON.stringify(result))
     }
   })
 
 });