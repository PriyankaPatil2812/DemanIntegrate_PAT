/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/
/*@author Supriya Gore
 * Desc:Register agency
 @version 1.0
 */
var express = require("express");
var router = express.Router();
// const validateLoginInput = require('../validation/login');
var dateTime = require("node-datetime");
// const isEmpty = require('../validation/is-empty');
let emailSend = require('./emailSend');
//for properties file
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./status/leadStatus.file');
var pool = require('./database/database');
url = require("url");
// var dt = dateTime.create();
// var formatted = dt.format("Y-m-d H:M:S");
const request = require("request");
var log = require('../configuration/logger').LOG
var errors;
const authCheck = require('./check_auth')
// const path = require('path');

module.exports = router;

//insert publisher details into agency_details table
router.post('/advertiserCompanyInformation', (req, res, next)=> {
  log.info("inside advertiserCompanyInformation");
    var advertiserName=req.body.advertiserName;
    
    var website=req.body.website;
    var email=req.body.email;
    var phone=req.body.phone;
    var country=req.body.country;
    var state=req.body.state;
    var city=req.body.city;
    var zipCode=req.body.zipCode;
    if(zipCode=="undefined" || !zipCode){zipCode=""}
    
    var countryCode=req.body.countryCode;
    var dcEmail=req.body.dcEmail;
    var timezone=req.body.timezone;
    var address=req.body.address;
    var file=[];

    if(dcEmail===undefined||dcEmail==='undefined'||dcEmail===null)
    {
        dcEmail="No";
    }
    var dcTelemarketing=req.body.dcTelemarketing;
    if(dcTelemarketing===undefined||dcTelemarketing==='undefined'||dcTelemarketing===null)
    {
        dcTelemarketing="No";
    }
    var dcDisplay=req.body.dcDisplay;
    if(dcDisplay===undefined||dcDisplay==='undefined'||dcDisplay===null)
    {
        dcDisplay="No";
    }
    var dcProgrammatic=req.body.dcProgrammatic;
    if(dcProgrammatic===undefined||dcProgrammatic==='undefined'||dcProgrammatic===null)
    {
        dcProgrammatic="No";
    }
    var dcSocial=req.body.dcSocial;
    if(dcSocial===undefined||dcSocial==='undefined'||dcSocial===null)
    {
        dcSocial="No";
    }
    // var phone=req.body.phone;
    // var phone=req.body.phone;
    // var phone=req.body.phone;

    
    var dt = dateTime.create();
    var formatted = dt.format("Y-m-d H:M:S");
    
    var status =properties.get('publisher.newPublisher');
    // var query="insert into advertiser_details(advertiserName,address,email,website,phone,country,state,city,zipcode,timezone,countryCode,dcEmail,dcTelemarketing,dcDisplay,dcProgrammatic,dcSocial,logo,created,lastUpdated,status) values('"+advertiserName+"','"+address+"','"+email+"','"+website+"','"+phone+"','"+country+"','"+state+"','"+city+"','"+zipCode+"','"+timezone+"','"+countryCode+"','"+dcEmail+"','"+dcTelemarketing+"','"+dcDisplay+"','"+dcProgrammatic+"','"+dcSocial+"','"+fileContents+"','"+formatted+"','"+formatted+"','"+status+"')";
    const {isLogoUpload}=req.body;
    if(!isLogoUpload || isLogoUpload=="false"){
    var query = "insert into advertiser_details SET ?",
    values = {
      advertiserName:advertiserName,
      address:address,
      email:email,
      website:website,
      phone:phone,
      country:country,
      state:state,
      city:city,
      zipcode:zipCode,
      timezone:timezone,
      countryCode:countryCode,
      dcEmail:dcEmail,
      dcTelemarketing:dcTelemarketing,
      dcDisplay:dcDisplay,
      dcProgrammatic:dcProgrammatic,
      dcSocial:dcSocial,
      created:formatted,
      lastUpdated:formatted,
      status:status
    }
   }else{
    file = req.files.file;
     let logo=file.data;
     let logoName=file.name || "";
    var query = "insert into advertiser_details SET ?",
    values = {
      advertiserName:advertiserName,
      address:address,
      email:email,
      website:website,
      phone:phone,
      country:country,
      state:state,
      city:city,
      zipcode:zipCode,
      timezone:timezone,
      countryCode:countryCode,
      dcEmail:dcEmail,
      dcTelemarketing:dcTelemarketing,
      dcDisplay:dcDisplay,
      dcProgrammatic:dcProgrammatic,
      dcSocial:dcSocial,
      logoName,
      logo,
      created:formatted,
      lastUpdated:formatted,
      status:status
    }
   }
    
    
   pool.query(query,values,function(error,results,fields){
        if(error){
          log.error("error inside advertiserCompanyInformation==>"+error);
            return res.status(400).json(errors);
        }else{
            var advertiserID=results.insertId;
            emailSend.advertiserCreation(email,advertiserID);
            var success="Advertiser OnBoarding request submitted successfully (Advertiser ID:"+advertiserID+")";
            res.json({ success: true, message: success,'advertiserID': advertiserID});
        }
       
      
       
    });
 });


 
/**
* @author Supriya Gore
* @param  Description validating email
* @return Description return respective message
*/
router.get("/validateEmail", function(req, res, next) {
  log.info("inside validateEmail");
    
    var email = url.parse(req.url, true).query.email;
    var sql="select advertiserID,email from advertiser_details where email='"+email+"'";
    
  pool.query(sql,function(error, results, fields) {
      if (error) {
        log.error("error inside validateEmail==>"+error);
        
        return res.status(400).json(errors);
      }else{
        log.info("sql inside validateEmail===>"+sql);
      
            if(results.length>0){
              
             res.json({success: false});
            }
            else{
              
              res.json({success: true});
            }
          }
     });
  
  });

  
/**
* @author Somnath Keswad
* @param  Description get Advertiser Info
* @return Description return Advertiser Info in JSON format
*/
router.get("/getAdvInfoForEdit",authCheck, (req, res, next)=> {
  log.info("Inside getAdvInfoForEdit");
  // const advertiserID = url.parse(req.url,true).query.advertiserID;
  var advertiserID = req.token.id; // kiran - task 3765- VAPT-Advertiser side-report and settings -URL links & API -BE
  let sql=`SELECT advertiserID, advertiserName, email, website, phone, country, state, city, zipcode, timezone, countryCode, address, rating, gdprCompliance, dcEmail, dcTelemarketing, dcDisplay, dcProgrammatic, dcSocial, logoName FROM advertiser_details where advertiserID='${advertiserID}'`;
  // console.log("sql==>"+sql)
  pool.query(sql,(error, advertiserInfo, fields)=> {
      if (error) {
        log.error("Error AdvertiserOnBoardDetails/getAdvInfoForEdit:"+error);
        return res.status(400).json(error);
      }else{
             res.send(JSON.stringify(advertiserInfo));
          }
     });// End of advertiserInfo
});// End of getAdvInfoForEdit
/**
* @author Somnath Keswad
* @param  Description get Advertiser Info
* @return Description return Advertiser Info in JSON format
*/
router.get("/getAdvContactEdit",authCheck, (req, res, next)=> {
  log.info("Inside getAdvContactEdit");
  // const advertiserID = url.parse(req.url, true).query.advertiserID; // kiran - task 3765- VAPT-Advertiser side-report and settings -URL links & API -BE
  var advertiserID= req.token.id;
  let sql=`select * from contact_info where orgID='${advertiserID}' and role='ADV'`;
  pool.query(sql,(error, contactInfo, fields)=> {
    if (error) {
      log.error("Error AdvertiserOnBoardDetails/getAdvContactEdit:"+error);
      return res.status(400).json(error);
    }else{
      let contact1=contactInfo.filter((a)=>a.contactID==1);
      if(contact1.length>0){
        contact1[0].orgID=contact1[0].orgID || advertiserID;
        contact1[0].contactID=contact1[0].contactID || 1;
        contact1[0].firstName=contact1[0].firstName || '';
        contact1[0].lastName=contact1[0].lastName || '';
        contact1[0].designation=contact1[0].designation || '';
        contact1[0].countryPhoneCode=contact1[0].countryPhoneCode || '';
        contact1[0].phoneNo=contact1[0].phoneNo || '';
        contact1[0].role=contact1[0].role || 'ADV';
      }else{
        contact1=[{orgID:advertiserID,contactID:1,firstName:'',lastName:'',designation:'',countryPhoneCode:'',phoneNo:'',role:'ADV'}];
      }
      let contact2=contactInfo.filter((a)=>a.contactID==2);
      if(contact2.length>0){
        contact2[0].orgID=contact2[0].orgID || advertiserID;
        contact2[0].contactID=contact2[0].contactID || 2;
        contact2[0].firstName=contact2[0].firstName || '';
        contact2[0].lastName=contact2[0].lastName || '';
        contact2[0].designation=contact2[0].designation || '';
        contact2[0].countryPhoneCode=contact2[0].countryPhoneCode || '';
        contact2[0].phoneNo=contact2[0].phoneNo || '';
        contact2[0].role=contact2[0].role || 'ADV';
      }else{
        contact2=[{orgID:advertiserID,contactID:2,firstName:'',lastName:'',designation:'',countryPhoneCode:'',phoneNo:'',role:'ADV'}];
      }
      let advertiserDetail=[];
      advertiserDetail=contact1.concat(contact2);
      res.send(JSON.stringify(advertiserDetail));
    }
  });// End of contact_Info
})// End of getAdvContactEdit

/**
* @author Somnath Keswad
* @param  Description Update Advertiser Info
* @return Description return success message
*/
router.post("/editAdvertiserInfo",authCheck, (req, res, next) => {
  log.info("Inside editAdvertiserInfo");
  let {advertiserInfo,fileUploadFlag } = req.body;
  var advertiserID= req.token.id; // kiran - task 3765-VAPT-Advertiser side-report and settings -URL links & API -BE
  advertiserInfo=JSON.parse(advertiserInfo);
  let file=[],fileContents,logoName='';
  fileUploadFlag=fileUploadFlag || false;
  if(fileUploadFlag=="true"){
    file = req.files.logo;
    fileContents=file.data;
    logoName=file.name;
    fileContents = Buffer.from(fileContents, "base64");
    }
  let dt = dateTime.create();
  let formatted = dt.format("Y-m-d H:M:S");
  let { advertiserName, email, website, phone, country, state, city, zipcode, timezone, countryCode, address, rating, gdprCompliance, dcEmail, dcTelemarketing, dcDisplay, dcProgrammatic, dcSocial, } = advertiserInfo[0];
  state=state||'';
  zipcode=zipcode||'';

  let sql = `update advertiser_details set ? where advertiserID='${advertiserID}'`;
  if(fileUploadFlag=="true"){
    values = {
      advertiserName, email, website, phone, country, state, city, zipcode, timezone, countryCode, address, rating, gdprCompliance, dcEmail, dcTelemarketing, dcDisplay, dcProgrammatic, dcSocial, logo:fileContents, logoName, lastUpdated: formatted
    }
  }else{
    values = {
      advertiserName, email, website, phone, country, state, city, zipcode, timezone, countryCode, address, rating, gdprCompliance, dcEmail, dcTelemarketing, dcDisplay, dcProgrammatic, dcSocial,  lastUpdated: formatted
    }
  }
  pool.query(sql, values, (error, result, fields) => {
    if (error) {
      log.error("Error AdvertiserOnBoardDetails/editAdvertiserInfo:" + error);
      return res.status(400).json(error);
    } else {
      res.json({ success: true, message: 'Advertiser information saved successfully' });
    }
  });// End of Updating advertiserInfo
})// End of editAdvertiserInfo

/**
* @author Somnath Keswad
* @param  Description Update Advertiser Contact Info
* @return Description return success message
*/
router.post("/editContactInfo",authCheck, (req, res, next) => {
  log.info("Inside editContactInfo");
  let dt = dateTime.create();
  let formatted = dt.format("Y-m-d H:M:S");
  let {contact1, contact2}=req.body;
  var advertiserID =req.token.id; //kiran - task 3765-VAPT-Advertiser side-report and settings -URL links & API -BE

    let sql1 = "select * from contact_info where orgID='" + advertiserID + "' and role='ADV'";
      pool.query(sql1, (error, contact_info, fields) => {
        if (error) {
          log.error("Error AdvertiserOnBoardDetails/editContactInfo:" + error);
          return res.status(400).json(error);
        } else {
          let contact = contact1.concat(contact2),cnt=0;
          for (let i = 0; i < 2; i++) {
            let { orgID, contactID, firstName, lastName, designation, email, countryPhoneCode, phoneNo, role, status } = contact[i];
            let chkres = contact_info.filter((a) => a.contactID == contactID);
            let sql = "";
            if (chkres.length == 0) {
              sql = "insert into contact_info set ?",
                values = { orgID: advertiserID, contactID, firstName, lastName, designation, email, countryPhoneCode, phoneNo, role: 'ADV', status: 'Step2', created: formatted, lastUpdated: formatted }
            } else {
              sql = "update contact_info set ? where orgID='" + advertiserID + "' and contactID='" + contactID + "'",
                values = { contactID, firstName, lastName, designation, email, countryPhoneCode, phoneNo, lastUpdated: formatted }
              }
              console.log("---------"+sql1)
              console.log("***"+chkres.length)
            pool.query(sql,values, (error, results, fields) => {
              if (error) {
                log.error("Error AdvertiserOnBoardDetails/editContactInfo:" + error);
                cnt++;
                if(cnt==2){
                  let message='Contact information is not saved due to '+error
                  return res.json({ success: true, message});
                }
              }
              else{
                cnt++;
                if(cnt==2){
                  res.json({ success: true, message: 'Contact information saved successfully' });
                }
              }
            })// End of insert/update contact_info
          }// End of for Loop
        }
      });// End of getting contact_info
})// End of editContactInfo



 /**
 * @author Sonali
 * @param  Description  get advertiser details
 * @return Description return successfully returns advertiser information
 */
router.post('/advertiserDetails',authCheck, function(req, res, next) {
	log.info("inside advertiserDetails");
	  //  var advertiserID=req.body.advertiserID;
    var advertiserID=req.token.id;// kiran -task 3765-VAPT-Advertiser side-report and settings -URL links & API -BE
   
		   var errors;
     var query="SELECT a.advertiserID,a.advertiserName,a.email,a.website,a.phone,a.country,a.state,a.city,a.zipcode,a.timezone,a.countryCode,a.address,a.rating,a.gdprCompliance,a.dcEmail,a.dcTelemarketing,a.dcDisplay,a.dcProgrammatic,a.dcSocial,a.logo,bi.bankName,bi.accountNumber,bi.accountHolderName,bi.ifscCode,bi.panNumber,bi.gstNumber from advertiser_details a left join bank_info bi on a.advertiserID=bi.orgID where a.advertiserID='"+advertiserID+"'";

     console.log("query--->>"+query)
     
    
   pool.query(query, function (error, results, fields) {
	   if (error) {
		   log.error("Error in advertiserDetails=" + error);
		   return res.status(400).json(errors);
		   }else{
        //  log.info("inside advertiserDetails sql==>"+query);
        // console.log(JSON.stringify(results));

			
			   res.send(JSON.stringify(results));
	   }
	});
	
	   
});


 /**
 * @author Sonali
 * @param  Description  get advertiser details
 * @return Description return adcertiser details of contact
 */
router.post('/advertiserContactDetails',authCheck, function(req, res, next) {
	log.info("inside agenpublisherContactDetailscyContactDetails");
	  //  var advertiserID=req.body.advertiserID;
	  var advertiserID=req.token.id;
   
		   var errors;
	   var query="SELECT ci.contactID,ci.firstName,ci.lastName,ci.designation,ci.email,ci.countryPhoneCode,ci.phoneNo,ci.role from contact_info ci where ci.orgID='"+advertiserID+"'";
	
	   //query=mysql.escape(query);
   pool.query(query, function (error, results, fields) {
	 
	   if (error) {
		   log.error("Error in advertiserContactDetails=" + error);
		   return res.status(400).json(errors);
		   }else{
			  //  log.info("inside advertiserContactDetails sql==>"+query);
			
			   res.send(JSON.stringify(results));
	   }
	});
	
	   
});



