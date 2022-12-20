
/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/

/*@author Sandeep Dhawale
*@fileName :
 *Desc: Publisher Company Information Edit Tab
*/
import React from 'react';
import 'antd/dist/antd.css';
import Footer from "../layouts/footer";
import * as $ from "jquery";
import {Form,Input,Tooltip,Icon,Cascader,Select,Row,Col,Checkbox,Button,AutoComplete,Card} from 'antd';
import ReCAPTCHA from 'react-google-recaptcha';
import Picky from "react-picky";
import "./publisherCompanyinformation.css";
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { logoutUser } from '../login/authentication';
import { withRouter } from 'react-router-dom';
import { bake_cookie, read_cookie, delete_cookie } from 'sfcookies';
import { Left } from 'react-bootstrap/lib/Media';
import { fetch_custom as fetch } from "../../configration/fetch_default_headers"; // Priyanka--3944--added default header


const cookie_key = 'publisherID';
const { Option } = Select;
const Swal = require('sweetalert2');
const {TextArea}=Input


const AutoCompleteOption = AutoComplete.Option;
var publisherOnBoardMsg;
var chkBoxLength=0;
const TimeZoneOption=[

  { id: '(GMT-12:00) International Date Line West', name: '(GMT-12:00) International Date Line West' },
  { id: '(GMT-11:00) Midway Island, Samoa', name: '(GMT-11:00) Midway Island, Samoa' },
  { id: '(GMT-10:00) Hawaii', name: '(GMT-10:00) Hawaii' },
  { id: '(GMT-09:00) Alaska', name: '(GMT-09:00) Alaska' },
  { id: '(GMT-08:00) Pacific Time (US & Canada)', name: '(GMT-08:00) Pacific Time (US & Canada)' },
  { id: '(GMT-08:00) Tijuana, Baja California', name: '(GMT-08:00) Tijuana, Baja California' },
  { id: '(GMT-07:00) Arizona', name: '(GMT-07:00) Arizona' },
  { id: '(GMT-07:00) Chihuahua, La Paz, Mazatlan', name: '(GMT-07:00) Chihuahua, La Paz, Mazatlan' },
  { id: '(GMT-07:00) Mountain Time (US & Canada)pport', name: '(GMT-07:00) Mountain Time (US & Canada)' },
  { id: '(GMT-06:00) Central America', name: '(GMT-06:00) Central America' },
  { id: '(GMT-06:00) Guadalajara, Mexico City, Monterrey', name: '(GMT-06:00) Guadalajara, Mexico City, Monterrey' },
  { id: '(GMT-06:00) Central Time (US & Canada)(GMT-06:00) Central Time (US & Canada)', name: '(GMT-06:00) Central Time (US & Canada)' },
  
  { id: '(GMT-06:00) Saskatchewan', name: '(GMT-06:00) Saskatchewan' },
  { id: '(GMT-05:00) Bogota, Lima, Quito, Rio Branco', name: '(GMT-05:00) Bogota, Lima, Quito, Rio Branco' },
  { id: '(GMT-05:00) Eastern Time (US & Canada)', name: '(GMT-05:00) Eastern Time (US & Canada)' },
  { id: '(GMT-05:00) Indiana (East)', name: '(GMT-05:00) Indiana (East)' },
  { id: '(GMT-04:00)Georgetown, La Paz, San Juan', name: '(GMT -04:00)Georgetown, La Paz, San Juan'},
  { id: '(GMT-04:00) Atlantic Time (Canada)', name: '(GMT-04:00) Atlantic Time (Canada)' },
  { id: '(GMT-04:00) Caracas, La Paz', name: '(GMT-04:00) Caracas, La Paz' },
  { id: '(GMT-04:00) Manaus', name: '(GMT-04:00) Manaus' },
  { id: '(GMT-04:00) Santiago', name: '(GMT-04:00) Santiago' },
  { id: '(GMT-04:00) Asuncion', name: '(GMT-04:00) Asuncion'},
  { id: '(GMT-03:30) Newfoundland', name: '(GMT-03:30) Newfoundland' },
  { id: '(GMT-03:00) Brasilia', name: '(GMT-03:00) Brasilia' },
  { id: '(GMT-03:00) Buenos Aires, Georgetown', name: '(GMT-03:00) Buenos Aires, Georgetown' },
  { id: '(GMT-03:00)Brasilia', name: '(GMT -03:00)Brasilia'},
  { id: '(GMT-03:00) Georgetown', name: '(GMT-03:00) Georgetown'},
  { id: '(GMT-03:00) Greenland', name: '(GMT-03:00) Greenland' },
  
  { id: '(GMT-03:00) Buenos Aires', name: '(GMT-03:00) Buenos Aires'},
  { id: '(GMT-03:00) Montevideo', name: '(GMT-03:00) Montevideo' },
  { id: '(GMT-02:00) Mid-Atlantic', name: '(GMT-02:00) Mid-Atlantic' },
  { id: '(GMT-01:00) Cape Verde Island', name: '(GMT-01:00) Cape Verde Island' },
  { id: '(GMT-01:00) Azores', name: '(GMT-01:00) Azores' },
  { id: '(GMT) Monrovia, Reykjavik', name: '(GMT) Monrovia, Reykjavik'},
  { id: '(GMT) Casablanca', name: '(GMT) Casablanca'},
  { id: '(GMT) Coordinated Universal Time', name: '(GMT) Coordinated Universal Time'},
  { id: '(GMT+00:00) Casablanca, Monrovia, Reykjavik', name: '(GMT+00:00) Casablanca, Monrovia, Reykjavik' },
  { id: '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London', name: '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London' },
  { id: '(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna', name: '(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' },
  { id: '(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague', name: '(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague' },
  { id: '(GMT+01:00) Brussels, Copenhagen, Madrid, Paris', name: '(GMT+01:00) Brussels, Copenhagen, Madrid, Paris' },
  { id: '(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb', name: '(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb' },
  { id: '(GMT+01:00) West Central Africa', name: '(GMT+01:00) West Central Africa' },
  { id: '(GMT+02:00) Amman', name: '(GMT+02:00) Amman' },
  { id: '(GMT+02:00) Athens, Bucharest, Istanbul', name: '(GMT+02:00) Athens, Bucharest, Istanbul' },
  { id: '(GMT+02:00) Beirut', name: '(GMT+02:00) Beirut' },
  { id: '(GMT+02:00) Cairo', name: '(GMT+02:00) Cairo' },
  { id: '(GMT+02:00) Harare, Pretoria', name: '(GMT+02:00) Harare, Pretoria' },
  { id: '(GMT+02:00) Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius', name: '(GMT+02:00) Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius' },
  { id: '(GMT+02:00) Jerusalem', name: '(GMT+02:00) Jerusalem' },
  { id: '(GMT+02:00) Minsk', name: '(GMT+02:00) Minsk' },
  { id: '(GMT+02:00) Windhoek', name: '(GMT+02:00) Windhoek' },
  { id: '(GMT+03:00) Kuwait, Riyadh, Baghdad', name: '(GMT+03:00) Kuwait, Riyadh, Baghdad' },
  { id: '(GMT+03:00) Moscow, St. Petersburg, Volgograd', name: '(GMT+03:00) Moscow, St. Petersburg, Volgograd' },
  { id: '(GMT+03:00) Nairobi', name: '(GMT+03:00) Nairobi' },
  { id: '(GMT+03:00) Baghdad', name: '(GMT+03:00) Baghdad'}, 
  { id: '(GMT+03:00) Tbilisi', name: '(GMT+03:00) Tbilisi' },
  { id: '(GMT+03:30) Tehran', name: '(GMT+03:30) Tehran' },
  { id: '(GMT+04:00) Abu Dhabi, Muscat', name: '(GMT+04:00) Abu Dhabi, Muscat' },
  { id: '(GMT+04:00) Baku', name: '(GMT+04:00) Baku' },
  { id: '(GMT+04:00) Baku, Tbilisi, Yerevan', name: '(GMT+04:00) Baku, Tbilisi, Yerevan'},
  { id: '(GMT+04:00) Yerevan', name: '(GMT+04:00) Yerevan' },
  { id: '(GMT+04:30) Kabul', name: '(GMT+04:30) Kabul' },
  { id: '(GMT-04:30) Caracas', name: '(GMT-04:30) Caracas'},
  { id: '(GMT+05:00) Yekaterinburg', name: '(GMT+05:00) Yekaterinburg' },
  { id: '(GMT+05:00) Ekaterinburg', name: '(GMT+05:00) Ekaterinburg'},
  { id: '(GMT+05:00) Islamabad, Karachi, Tashkent', name: '(GMT+05:00) Islamabad, Karachi, Tashkent' },
  { id: '(GMT+05:30) Sri Jayawardenapura', name: '(GMT+05:30) Sri Jayawardenapura' },
  { id: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi', name: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { id: '(GMT+05:45) Kathmandu', name: '(GMT+05:45) Kathmandu' },
  { id: '(GMT+06:00) Almaty, Novosibirsk', name: '(GMT+06:00) Almaty, Novosibirsk' },
  { id: '(GMT-06:00) Guadalajara, Mexico City, Monterrey - New', name: '(GMT-06:00) Guadalajara, Mexico City, Monterrey - New'},
  { id: '(GMT+06:00) Astana, Dhaka', name: '(GMT+06:00) Astana, Dhaka' },
  { id: '(GMT+06:30) Yangon (Rangoon)', name: '(GMT+06:30) Yangon (Rangoon)' },
  { id: '(GMT+07:00) Bangkok, Hanoi, Jakarta', name: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
  { id: '(GMT+07:00) Krasnoyarsk', name: '(GMT+07:00) Krasnoyarsk' },
  { id: '(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi', name: '(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi' },
  { id: '(GMT+08:00) Kuala Lumpur, Singapore', name: '(GMT+08:00) Kuala Lumpur, Singapore' },
  { id: '(GMT+08:00) Irkutsk, Ulaan Bataar', name: '(GMT+08:00) Irkutsk, Ulaan Bataar' },
  { id: '(GMT+08:00) Perth', name: '(GMT+08:00) Perth' },
  { id: '(GMT+08:00) Taipei', name: '(GMT+08:00) Taipei' },
  { id: '(GMT+09:00) Osaka, Sapporo, Tokyo', name: '(GMT+09:00) Osaka, Sapporo, Tokyo' },
  { id: '(GMT+09:00) Seoul', name: '(GMT+09:00) Seoul' },
  { id: '(GMT+09:00) Yakutsk', name: '(GMT+09:00) Yakutsk' },
  { id: '(GMT+09:30) Adelaide', name: '(GMT+09:30) Adelaide' },
  { id: '(GMT+09:30) Darwin', name: '(GMT+09:30) Darwin' },
  { id: '(GMT+10:00) Brisbane', name: '(GMT+10:00) Brisbane' },
  { id: '(GMT+10:00) Canberra, Melbourne, Sydney', name: '(GMT+10:00) Canberra, Melbourne, Sydney' },
  { id: '(GMT+10:00) Hobart', name: '(GMT+10:00) Hobart' },
  { id: '(GMT+10:00) Guam, Port Moresby', name: '(GMT+10:00) Guam, Port Moresby' },
  { id: '(GMT+10:00) Vladivostok', name: '(GMT+10:00) Vladivostok' },
  { id: '(GMT+11:00) Magadan, Solomon Island., New Caledonia', name: '(GMT+11:00) Magadan, Solomon Island., New Caledonia' },
  { id: '(GMT+12:00) Auckland, Wellington', name: '(GMT+12:00) Auckland, Wellington' },
  { id: '(GMT+12:00) Petropavlovsk-Kamchatsky', name: '(GMT+12:00) Petropavlovsk-Kamchatsky'},
  { id: '(GMT+12:00) Fiji, Kamchatka, Marshall Island', name: '(GMT+12:00) Fiji, Kamchatka, Marshall Island' },
  { id: '(GMT+13:00) Nuku alofa', name: '(GMT+13:00) Nuku alofa' },
 
 
]

const CountriesArray1=
[
      {id: "Afghanistan", name: "Afghanistan"},
      {id: "Albania", name: "Albania"},
      {id: "Algeria", name: "Algeria"},
      {id: "American Samoa", name: "American Samoa"},
      {id: "Andorra", name: "Andorra"},
      {id: "Angola", name: "Angola"},
      {id: "Anguilla", name: "Anguilla"},
      {id: "Antigua and Barbuda", name: "Antigua and Barbuda"},
      {id: "Argentina", name: "Argentina"},
      {id: "Armenia", name: "Armenia"},
      {id: "Aruba", name: "Aruba"},
      {id: "Australia", name: "Australia"},
      {id: "Austria", name: "Austria"},
      {id: "Azerbaijan", name: "Azerbaijan"},
      {id: "Bahamas", name: "Bahamas"},
      {id: "Bahrain", name: "Bahrain"},
      {id: "Bangladesh", name: "Bangladesh"},
      {id: "Barbados", name: "Barbados"},
      {id: "Belarus", name: "Belarus"},
      {id: "Belgium", name: "Belgium"},
      {id: "Belize", name: "Belize"},
      {id: "Benin", name: "Benin"},
      {id: "Bermuda", name: "Bermuda"},
      {id: "Bhutan", name: "Bhutan"},
      {id: "Bolivia", name: "Bolivia"},
      {id: "Bosnia and Herzegovina", name: "Bosnia and Herzegovina"},
      {id: "Botswana", name: "Botswana"},
      {id: "Brazil", name: "Brazil"},
      {id: "British Virgin Islands", name: "British Virgin Islands"},
      {id: "Brunei", name: "Brunei"},
      {id: "Bulgaria", name: "Bulgaria"},
      {id: "Burkina Faso", name: "Burkina Faso"},
      {id: "Burundi", name: "Burundi"},
      {id: "CaboVerde", name: "CaboVerde"},   
      {id: "Cambodia", name: "Cambodia"},
      {id: "Cameroon", name: "Cameroon"},
      {id: "Canada", name: "Canada"},
      {id: "Canary Islands", name: "Canary Islands"},
      {id: "Cayman Islands", name: "Cayman Islands"},
      {id: "Central African Republic", name: "Central African Republic"},
      {id: "Chad", name: "Chad"},
      {id: "Chile", name: "Chile"},
      {id: "China", name: "China"},
      {id: "Colombia", name: "Colombia"},
      {id: "Comoros", name: "Comoros"},
      {id: "Congo, Dem Rep of the", name: "Congo, Dem Rep of the"},
      {id: "Congo", name: "Congo"},
      {id: "Cook Islands", name: "Cook Islands"},
      {id: "Costa Rica", name: "Costa Rica"},
      {id: "Cote d Ivoire", name: "Cote d Ivoire"},
      {id: "Croatia", name: "Croatia"},
      {id: "Cuba", name: "Cuba"},
      {id: "Cyprus", name: "Cyprus"},
      {id: "Czech Republic", name: "Czech Republic"},
      {id: "Denmark", name: "Denmark"},
      {id: "Djibouti", name: "Djibouti"},
      {id: "Dominica", name: "Dominica"},
      {id: "Dominican Republic", name: "Dominican Republic"},
      {id: "Ecuador", name: "Ecuador"},
      {id: "Egypt", name: "Egypt"},
      {id: "El Salvador", name: "El Salvador"},
      {id: "Equatorial Guinea", name: "Equatorial Guinea"},
      {id: "Eritrea", name: "Eritrea"},
      {id: "Estonia", name: "Estonia"},
      {id: "Eswatini", name: "Eswatini"},
      {id: "Ethiopia", name: "Ethiopia"},
      {id: "Fiji", name: "Fiji"},
      {id: "Finland", name: "Finland"},
      {id: "France", name: "France"},
      {id: "French Guiana", name: "French Guiana"},
      {id: "French Polynesia", name: "French Polynesia"}, 
      {id: "Gabon", name: "Gabon"}, 
      {id: "Gambia", name: "Gambia"},
      {id: "Georgia", name: "Georgia"},
      {id: "Germany", name: "Germany"},
      {id: "Ghana", name: "Ghana"},
      {id: "Gibraltar", name: "Gibraltar"},
      {id: "Greece", name: "Greece"},
      {id: "Greenland", name: "Greenland"},
      {id: "Grenada", name: "Grenada"},
      {id: "Guadeloupe", name: "Guadeloupe"},
      {id: "Guam", name: "Guam"},
      {id: "Guatemala", name: "Guatemala"},
      {id: "Guinea", name: "Guinea"},
      {id: "Guinea-BissauGuyana", name: "Guinea-BissauGuyana"},
      {id: "Haiti", name: "Haiti"},
      {id: "HolySee", name: "HolySee"},
      {id: "Honduras", name: "Honduras"},
      {id: "Hong Kong", name: "Hong Kong"},
      {id: "Hungary", name: "Hungary"},
      {id: "Iceland", name: "Iceland"},
      {id: "India", name: "India"},
      {id: "Indonesia", name: "Indonesia"},
      {id: "Iran", name: "Iran"},
      {id: "Ireland", name: "Ireland"},
      {id: "Israel", name: "Israel"},
      {id: "Italy", name: "Italy"},
      {id: "Jamaica", name: "Jamaica"},
      {id: " Japan", name: " Japan"},
      {id: "Jordan", name: "Jordan"},
      {id: "Kazakhstan", name: "Kazakhstan"},
      {id: "Kenya", name: "Kenya"},
      {id: "Kiribati", name: " Kiribati"},
      {id: "South Korea", name: "South Korea"},
      {id: "North Korea", name: " North Korea"},
      {id: "Kuwait", name: "Kuwait"},
      {id: "Kyrgyzstan", name: "Kyrgyzstan"},
      {id: "Lao People's Democratic Republic", name: "Lao People's Democratic Republic"},
      {id: "Latvia", name: "Latvia"},
      {id: "Lebanon", name: "Lebanon"},
      {id: "Lesotho", name: "Lesotho"},
      {id: "Liberia", name: "Liberia"},
      {id: "Libya", name: "Libya"},
      {id: "Luxembourg", name: "Luxembourg"},
      {id: "Liechtenstein", name: "Liechtenstein"},
      {id: "Lithuania", name: "Lithuania"},
      {id: "Madagascar", name: "Madagascar"},
      {id: "Malawi", name: "Malawi"},
      {id: "Malaysia", name: "Malaysia"},
      {id: "Maldives", name: "Maldives"},
      {id: "Mali", name: "Mali"},
      {id: "Malta", name: "Malta"},
      {id: "MarshallIslands", name: "MarshallIslands"},
      {id: "Martinique", name: "Martinique"},
      {id: "Mauritania", name: "Mauritania"},
      {id: "Mauritius", name: "Mauritius"},
      {id: "Mayotte", name: "Mayotte"},
      {id: "Mexico", name: "Mexico"},
      {id: "Micronesia", name: "Micronesia"},
      {id: "Moldova", name: "Moldova"},
      {id: "Monaco", name: "Monaco"},
      {id: "Mongolia", name: "Mongolia"},
      {id: "Montenegro", name: "Montenegro"},
      {id: "Montserrat", name: "Montserrat"},
       {id: "Morocco", name: "Morocco"},
      {id: "Mozambique", name: "Mozambique"},
      {id: "Myanmar", name: "Myanmar"},
      {id: "Namibia", name: "Namibia"},
      {id: "Nauru", name: "Nauru"},
      {id: "Nepal", name: "Nepal"},
      {id: "Netherlands Antilles", name: "Netherlands Antilles"},
      {id: " Netherlands", name: " Netherlands"},
      {id: "NewCaledonia", name: "NewCaledonia"},
      {id: " New Zealand", name: "New Zealand"},
      {id: " Nicaragua", name: " Nicaragua"},
      {id: " Niger", name: " Niger"},
      {id: " Nigeria", name: " Nigeria"},
      {id: "Niue", name: "Niue"},
      {id: "Northern Mariana Islands", name: "Northern Mariana Islands"},
      {id: "Norway", name: "Norway"},
      {id: "Oman", name: "Oman"},
      {id: "Pakistan", name: "Pakistan"},
      {id: "Palau", name: "Palau"},
      {id: "Palestine", name: "Palestine"},
      {id: "Panama", name: "Panama"},
      {id: "Papua", name: "Papua"},
      {id: "Paraguay", name: "Paraguay"},
      {id: "Peru", name: "Peru"},
      {id: "Philippines", name: "Philippines"},
      {id: "Poland", name: "Poland"},
      {id: "Portugal", name: "Portugal"},
      {id: "Puerto Rico", name: "Puerto Rico"},
      {id: "Qatar", name: "Qatar"},
      {id: "Reunion", name: "Reunion"},
      {id: "Romania", name: "Romania"},
      {id: "Russian Federation", name: "Russian Federation"},
      {id: "Rwanda", name: "Rwanda"},
      {id: "Saint Barthélemy", name: "Saint Barthélemy"},
      {id: "Saint Kitts and Nevis", name: "Saint Kitts and Nevis"},
      {id: "Saint Lucia", name: "Saint Lucia"},
      {id: "Saint Pierre", name: "Saint Pierre"},
      {id: "SaintVincent and the Grenadines", name: "SaintVincent and the Grenadines"},
      {id: "Samoa", name: "Samoa"},
      {id: "San Marino", name: "San Marino"},
      {id: "Sao Tome", name: "Sao Tome"},
      {id: "Saudi Arabia", name: "Saudi Arabia"},
      {id: "Senegal", name: "Senegal"},
      {id: "Serbia", name: "Serbia"},
      {id: "Seychelles", name: "Seychelles"},
      {id: "Sierra Leone", name: "Sierra Leone"},
      {id: "Singapore", name: "Singapore"},
      {id: "Slovakia", name: "Slovakia"},
      {id: "Slovenia", name: "Slovenia"},
      {id: "Solomon Islands", name: "Solomon Islands"},
      {id: "Somalia", name: "Somalia"},
      {id: "South Africa", name: "South Africa"},
      {id: "South Sudan", name: "South Sudan"},
      {id: "Spain", name: "Spain"},
      {id: "Sri Lanka", name: "Sri Lanka"},
      {id: "Sudan", name: "Sudan"}, 
      {id: "Suriname", name: "Suriname"},
      {id: "Sweden", name: "Sweden"},
      {id: "Switzerland", name: "Switzerland"},
      {id: "Syria", name: "Syria"},
      {id: " Taiwan", name: " Taiwan"},
      {id: "Tajikistan", name: "Tajikistan"},
      {id: "Tanzania", name: "Tanzania"},
      {id: "Thailand", name: "Thailand"},
      {id: "Timor-Leste", name: "Timor-Leste"},
      {id: "TogoToke", name: "TogoTokeTimor-Leste"},
      {id: "Tonga", name: "Tonga"},
      {id: "Trinidad and Tobago", name: "Trinidad and Tobago"},
      {id: "Tunisia", name: "Tunisia"},
      {id: "Turkey", name: "Turkey"},
      {id: "Turkmenistan", name: "Turkmenistan"},
      {id: "Turks and Caicos Islands", name: " Turks and Caicos Islands"},
      {id: "Tuvalu", name: "Tuvalu"},
      {id: "Uganda", name: "Uganda"},
      {id: "Ukraine", name: "Ukraine"},
      {id: "United Arab Emirates", name: "United Arab Emirates"},
      {id: "United Kingdom", name: "United Kingdom"},
      {id: "United States of America", name: "United States of America"},
      {id: "United States Virgin Islands", name: "United States Virgin Islands"},
      {id: "Uruguay", name: "Uruguay"},
      {id: "Uzbekistan", name: "Uzbekistan"},
      {id: "Vanuatu", name: "Vanuatu"},
      {id: " Venezuela", name: " Venezuela"},
      {id: "Vietnam", name: "Vietnam"},
      {id: " Yemen", name: " Yemen"},
      {id: "Zambia", name: "Zambia"},
      {id: "Zimbabwe", name: "Zimbabwe"},
      
]





class PublisherCompanyInformationEdit extends React.Component {
  constructor() {
    super();
    this.state = {
      value:null,
      timeZone:'',
      country:'',
      state:'',
      newsuccess:'',
      confirmDirty: false,
      autoCompleteResult: [],
      recaptcha:[],
      stateoptions:[],
      website:'',
      validateEmail:'',
      fileName:[],
      message:'',
      onBoardMessage:'',
      recaptchaResponse:'',
      buttonDisplay:'disabled btn add-button',
      country1:'',
      countryCode:[],
      countryPhone1:[],
      countryPhone2:[],
      state1:'',
      checkboxDisplay:'none',
      isChecked:'false',
      dcEmail:'No',
      dcTelemarketing:'No',
      dcDisplay:'No',
      dcProgrammatic:'No',
      dcSocial:'No',
      countryPhone:[],
      file:[],
      errors:{},
      pID:'',
      displayErrorMsg1:'none',
      contactPerson1Deatils:[{firstName:"",lastName:"",designation:"",email:"",phoneNo:"",countryPhoneCode:""}],
      contactPerson2Deatils:[{firstName:"",lastName:"",designation:"",email:"",phoneNo:"",countryPhoneCode:""}],
      publisherInfo1:[{publisherName:"",email:"",website:"",phone:"",country:"",contryCode:"",state:"",city:"",zipcode:"",timezone:"",address:"",dcEmail:"",dcTelemarketing:"",dcProgrammatic:"",dcSocial:"",dcDisplay:""}],
      publisherInfo:[],
      publisherGdprInfo:[],
      publisherContactDetails:[],
      contactperson1:[],
      contactperson2:[],
      fileUploadFlag:false,
      isFileUpload:false,
      CountriesStateArray:{
    
        "Afghanistan" : {
          "Badakhshan":{},       "Badghis":{},        "Baghlan":{},  "Balkh":{},        "Bamian" :{},        "Daykondi" :{},       "Farah" :{},       "Faryab":{},       "Ghazni":{},       "Ghowr":{},     "Helmand":{},"Herat":{}, "Jowzjan":{}, "Kabul":{},       "Kandahar":{},       "Kapisa":{},       "Khost":{},        "Konar":{},        "Kondoz":{},        "Laghman":{},       "Lowgar":{},        "Nangarhar":{},       "Nimruz":{},        "Nurestan":{},       "Oruzgan":{},  "Paktia":{},   "Paktika":{}, "Panjshir":{},  "Parvan":{}, "Samangan":{}, "Sar-e Pol":{},    "Takhar":{}, "Vardak":{},"Zabol":{},
         },
        
      
      
         "Albania" :{
           
           "Berat":{}, 
           "Dibres":{}, 
           "Durres":{}, 
           "Elbasan":{}, 
           "Fier":{}, 
           "Gjirokastre":{}, 
           "Korce":{}, 
           "Kukes":{}, 
           "Lezhe":{}, 
           "Shkoder":{}, 
           "Tirane":{}, 
           "Vlore":{},
         },
            "Algeria":{
           "Adrar":{}, "Ain Defla":{}, "Ain Temouchent":{}, "Alger":{}, "Annaba":{}, "Batna":{}, "Bechar":{}, "Bejaia":{}, "Biskra":{}, "Blida":{}, "Bordj Bou Arreridj":{}, "Bouira":{}, "Boumerdes":{}, "Chlef":{}, "Constantine":{}, "Djelfa":{}, "El Bayadh":{}, "El Oued":{}, "El Tarf":{}, "Ghardaia":{}, "Guelma":{}, "Illizi":{}, "Jijel":{}, "Khenchela":{}, "Laghouat":{}, "Muaskar":{}, "Medea":{}, "Mila":{}, "Mostaganem":{}, "M'Sila":{}, "Naama":{}, "Oran":{}, "Ouargla":{}, "Oum el Bouaghi":{}, "Relizane":{}, "Saida":{}, "Setif":{}, "Sidi Bel Abbes":{}, "Skikda":{}, "Souk Ahras":{}, "Tamanghasset":{}, "Tebessa":{}, "Tiaret":{}, "Tindouf":{}, "Tipaza":{}, "Tissemsilt":{}, "Tizi Ouzou":{}, "Tlemcen":{},
         },
        
        "Andorra":{
           "Andorra la Vella":{}, "Canillo":{}, "Encamp":{}, "Escaldes-Engordany":{}, "La Massana":{}, "Ordino":{}, "Sant Julia de Loria":{},
         },
       
         "Angola":{
           "Bengo":{}, "Benguela":{}, "Bie":{}, "Cabinda":{}, "Cuando Cubango":{}, "Cuanza Norte":{}, "Cuanza Sul":{}, "Cunene":{}, "Huambo":{}, "Huila":{}, "Luanda":{}, "Lunda Norte":{}, "Lunda Sul":{}, "Malanje":{}, "Moxico":{}, "Namibe":{}, "Uige":{}, "Zaire":{},
         },
      
         "Antigua and Barbuda":{
           "Barbuda":{}, "Redonda":{}, "Saint George":{}, "Saint John":{}, "Saint Mary":{}, "Saint Paul":{}, "Saint Peter":{}, "Saint Philip":{},
         },
       
         "Argentina":{
           "Buenos Aires":{}, "Buenos Aires Capital":{}, "Catamarca":{}, "Chaco":{}, "Chubut":{}, "Cordoba":{}, "Corrientes":{}, "Entre Rios":{}, "Formosa":{}, "Jujuy":{}, "La Pampa":{}, "La Rioja":{}, "Mendoza":{}, "Misiones":{}, "Neuquen":{}, "Rio Negro":{}, "Salta":{}, "San Juan":{}, "San Luis":{}, "Santa Cruz":{}, "Santa Fe":{}, "Santiago del Estero":{}, "Tierra del Fuego":{}, "Tucuman":{},
         },
       
      
      
         "Armenia":{
           "Aragatsotn":{}, "Ararat":{}, "Armavir":{}, "Geghark'unik'":{}, "Kotayk'":{}, "Lorri":{}, "Shirak":{}, "Syunik'":{}, "Tavush":{}, "Vayots' Dzor":{}, "Yerevan":{},
         },
       
      
         "Australia":{
           "New South Wales":{}, "Queensland":{}, "South Australia":{}, "Tasmania":{}, "Victoria":{}, "Western Australia":{},
         },
     
      
         "Austria":{
           "Burgenland":{}, "Kaernten":{}, "Niederoesterreich":{}, "Oberoesterreich":{}, "Salzburg":{}, "Steiermark":{}, "Tirol":{}, "Vorarlberg":{}, "Wien":{},
         },
        
      
         "Azerbaijan":{
           "Abseron Rayonu":{}, "Agcabadi Rayonu":{}, "Agdam Rayonu":{}, "Agdas Rayonu":{}, "Agstafa Rayonu":{}, "Agsu Rayonu":{}, "Astara Rayonu":{}, "Balakan Rayonu":{}, "Barda Rayonu":{}, "Beylaqan Rayonu":{}, "Bilasuvar Rayonu":{}, "Cabrayil Rayonu":{}, "Calilabad Rayonu":{}, "Daskasan Rayonu":{}, "Davaci Rayonu":{}, "Fuzuli Rayonu":{}, "Gadabay Rayonu":{}, "Goranboy Rayonu":{}, "Goycay Rayonu":{}, "Haciqabul Rayonu":{}, "Imisli Rayonu":{}, "Ismayilli Rayonu":{}, "Kalbacar Rayonu":{}, "Kurdamir Rayonu":{}, "Lacin Rayonu":{}, "Lankaran Rayonu":{}, "Lerik Rayonu":{}, "Masalli Rayonu":{}, "Neftcala Rayonu":{}, "Oguz Rayonu":{}, "Qabala Rayonu":{}, "Qax Rayonu":{}, "Qazax Rayonu":{}, "Qobustan Rayonu":{}, "Quba Rayonu":{}, "Qubadli Rayonu":{}, "Qusar Rayonu":{}, "Saatli Rayonu":{}, "Sabirabad Rayonu":{}, "Saki Rayonu":{}, "Salyan Rayonu":{}, "Samaxi Rayonu":{}, "Samkir Rayonu":{}, "Samux Rayonu":{}, "Siyazan Rayonu":{}, "Susa Rayonu":{}, "Tartar Rayonu":{}, "Tovuz Rayonu":{}, "Ucar Rayonu":{}, "Xacmaz Rayonu":{}, "Xanlar Rayonu":{}, "Xizi Rayonu":{}, "Xocali Rayonu":{}, "Xocavand Rayonu":{}, "Yardimli Rayonu":{}, "Yevlax Rayonu":{}, "Zangilan Rayonu":{}, "Zaqatala Rayonu":{}, "Zardab Rayonu":{}, "Ali Bayramli Sahari":{}, "Baki Sahari":{}, "Ganca Sahari":{}, "Lankaran Sahari":{}, "Mingacevir Sahari":{}, "Naftalan Sahari":{}, "Saki Sahari":{}, "Sumqayit Sahari":{}, "Susa Sahari":{}, "Xankandi Sahari":{}, "Yevlax Sahari":{}, "Naxcivan Muxtar":{},
         },
      
         "Bahamas":{
           "Acklins and Crooked Islands":{}, "Bimini":{}, "Cat Island":{}, "Exuma":{}, "Freeport":{}, "Fresh Creek":{}, "Governor's Harbour":{}, "Green Turtle Cay":{}, "Harbour Island":{}, "High Rock":{}, "Inagua":{}, "Kemps Bay":{}, "Long Island":{}, "Marsh Harbour":{}, "Mayaguana":{}, "New Providence":{}, "Nichollstown and Berry Islands":{}, "Ragged Island":{}, "Rock Sound":{}, "Sandy Point":{}, "San Salvador and Rum Cay":{},
         },
     
      
         "Bahrain":{
           "Al Hadd":{}, "Al Manamah":{}, "Al Mintaqah al Gharbiyah":{}, "Al Mintaqah al Wusta":{}, "Al Mintaqah ash Shamaliyah":{}, "Al Muharraq":{}, "Ar Rifa' wa al Mintaqah al Janubiyah":{}, "Jidd Hafs":{}, "Madinat Hamad":{}, "Madinat 'Isa":{}, "Juzur Hawar":{}, "Sitrah":{},
         },
       
      
         "Bangladesh":{
           "Barisal":{}, "Chittagong":{}, "Dhaka":{}, "Khulna":{}, "Rajshahi":{}, "Sylhet":{},
         },
   
         "Barbados":{
           "Christ Church":{}, "Saint Andrew":{}, "Saint George":{}, "Saint James":{}, "Saint John":{}, "Saint Joseph":{}, "Saint Lucy":{}, "Saint Michael":{}, "Saint Peter":{}, "Saint Philip":{}, "Saint Thomas":{},  
         },
   
         "Belarus":{
           "Brest":{}, "Homyel":{}, "Horad Minsk":{}, "Hrodna":{}, "Mahilyow":{}, "Minsk":{}, "Vitsyebsk":{},
         },
         
         "Belgium":{
           "Antwerpen":{}, "Brabant Wallon":{}, "Brussels":{}, "Flanders":{}, "Hainaut":{}, "Liege":{}, "Limburg":{}, "Luxembourg":{}, "Namur":{}, "Oost-Vlaanderen":{}, "Vlaams-Brabant":{}, "Wallonia":{}, "West-Vlaanderen":{},
         },
   
         "Belize":{
           "Belize":{}, "Cayo":{}, "Corozal":{}, "Orange Walk":{}, "Stann Creek":{}, "Toledo":{},
         },
         "Benin":{
           "Alibori":{}, "Atakora":{}, "Atlantique":{}, "Borgou":{}, "Collines":{}, "Donga":{}, "Kouffo":{}, "Littoral":{}, "Mono":{}, "Oueme":{}, "Plateau":{}, "Zou":{},
         },
   
         "Bermuda":{
           "Devonshire":{}, "Hamilton":{}, "Hamilton":{}, "Paget":{}, "Pembroke":{}, "Saint George":{}, "Saint George's":{}, "Sandys":{}, "Smith's":{}, "Southampton":{}, "Warwick":{},
         },
     
         "Bhutan":{
           "Bumthang":{}, "Chukha":{}, "Dagana":{}, "Gasa":{}, "Haa":{}, "Lhuntse":{}, "Mongar":{}, "Paro":{}, "Pemagatshel":{}, "Punakha":{}, "Samdrup Jongkhar":{}, "Samtse":{}, "Sarpang":{}, "Thimphu":{}, "Trashigang":{}, "Trashiyangste":{}, "Trongsa":{}, "Tsirang":{}, "Wangdue Phodrang":{}, "Zhemgang":{},
         },
         
         "Bolivia":{
           "Chuquisaca":{}, "Cochabamba":{}, "Beni":{}, "La Paz":{}, "Oruro":{}, "Pando":{}, "Potosi":{}, "Santa Cruz":{}, "Tarija":{},
         },
        
         "Bosnia and Herzegovina":{
           "Una-Sana [Federation]":{}, "Posavina [Federation]":{}, "Tuzla [Federation]":{}, "Zenica-Doboj [Federation]":{}, "Bosnian Podrinje [Federation]":{}, "Central Bosnia [Federation]":{}, "Herzegovina-Neretva [Federation]":{}, "West Herzegovina [Federation]":{}, "Sarajevo [Federation]":{}, " West Bosnia [Federation]":{}, "Banja Luka [RS]":{}, "Bijeljina [RS]":{}, "Doboj [RS]":{}, "Fo?a [RS]":{}, "Sarajevo-Romanija [RS]":{}, "Trebinje [RS]":{}, "Vlasenica [RS]":{},
         },
       
         "Botswana":{
           "Central":{}, "Ghanzi":{}, "Kgalagadi":{}, "Kgatleng":{}, "Kweneng":{}, "North East":{}, "North West":{}, "South East":{}, "Southern":{},
         },
        
         "Brazil":{
           "Acre":{}, "Alagoas":{}, "Amapa":{}, "Amazonas":{}, "Bahia":{}, "Ceara":{}, "Distrito Federal":{}, "Espirito Santo":{}, "Goias":{}, "Maranhao":{}, "Mato Grosso":{}, "Mato Grosso do Sul":{}, "Minas Gerais":{}, "Para":{}, "Paraiba":{}, "Parana":{}, "Pernambuco":{}, "Piaui":{}, "Rio de Janeiro":{}, "Rio Grande do Norte":{}, "Rio Grande do Sul":{}, "Rondonia":{}, "Roraima":{}, "Santa Catarina":{}, "Sao Paulo":{}, "Sergipe":{}, "Tocantins":{},
         },
   
         "Brunei":{
           "Belait":{}, "Brunei and Muara":{}, "Temburong":{}, "Tutong":{},
         },
   
         "Bulgaria":{
           "Blagoevgrad":{}, "Burgas":{}, "Dobrich":{}, "Gabrovo":{}, "Khaskovo":{}, "Kurdzhali":{}, "Kyustendil":{}, "Lovech":{}, "Montana":{}, "Pazardzhik":{}, "Pernik":{}, "Pleven":{}, "Plovdiv":{}, "Razgrad":{}, "Ruse":{}, "Shumen":{}, "Silistra":{}, "Sliven":{}, "Smolyan":{}, "Sofiya":{}, "Sofiya-Grad":{}, "Stara Zagora":{}, "Turgovishte":{}, "Varna":{}, "Veliko Turnovo":{}, "Vidin":{}, "Vratsa":{}, "Yambol":{},
         },
   
         "Burkina Faso":{
           "Bale":{}, "Bam":{}, "Banwa":{}, "Bazega":{}, "Bougouriba":{}, "Boulgou":{}, "Boulkiemde":{}, "Comoe":{}, "Ganzourgou":{}, "Gnagna":{}, "Gourma":{}, "Houet":{}, "Ioba":{}, "Kadiogo":{}, "Kenedougou":{}, "Komondjari":{}, "Kompienga":{}, "Kossi":{}, "Koulpelogo":{}, "Kouritenga":{}, "Kourweogo":{}, "Leraba":{}, "Loroum":{}, "Mouhoun":{}, "Namentenga":{}, "Nahouri":{}, "Nayala":{}, "Noumbiel":{}, "Oubritenga":{}, "Oudalan":{}, "Passore":{}, "Poni":{}, "Sanguie":{}, "Sanmatenga":{}, "Seno":{}, "Sissili":{}, "Soum":{}, "Sourou":{}, "Tapoa":{}, "Tuy":{}, "Yagha":{}, "Yatenga":{}, "Ziro":{}, "Zondoma":{}, "Zoundweogo":{},  
         },
       
         "Burma":{
           "Ayeyarwady":{}, "Bago":{}, "Magway":{}, "Mandalay":{}, "Sagaing":{}, "Tanintharyi":{}, "Yangon":{}, "Chin State":{}, "Kachin State":{}, "Kayin State":{}, "Kayah State":{}, "Mon State":{}, "Rakhine State":{}, "Shan State":{},
         },
   
         "Burundi":{
           "Bubanza":{}, "Bujumbura Mairie":{}, "Bujumbura Rural":{}, "Bururi":{}, "Cankuzo":{}, "Cibitoke":{}, "Gitega":{}, "Karuzi":{}, "Kayanza":{}, "Kirundo":{}, "Makamba":{}, "Muramvya":{}, "Muyinga":{}, "Mwaro":{}, "Ngozi":{}, "Rutana":{}, "Ruyigi":{},    
         },
       
         "Cambodia":{
           "Banteay Mean Chey":{}, "Batdambang":{}, "Kampong Cham":{}, "Kampong Chhnang":{}, "Kampong Spoe":{}, "Kampong Thum":{}, "Kampot":{}, "Kandal":{}, "Koh Kong":{}, "Kracheh":{}, "Mondol Kiri":{}, "Otdar Mean Chey":{}, "Pouthisat":{}, "Preah Vihear":{}, "Prey Veng":{}, "Rotanakir":{}, "Siem Reab":{}, "Stoeng Treng":{}, "Svay Rieng":{}, "Takao":{}, "Keb":{}, "Pailin":{}, "Phnom Penh":{}, "Preah Seihanu":{},
         },
      
         "Cameroon":{
           "Adamaoua":{}, "Centre":{}, "Est":{}, "Extreme-Nord":{}, "Littoral":{}, "Nord":{}, "Nord-Ouest":{}, "Ouest":{}, "Sud":{}, "Sud-Ouest":{},
         },
     
        "Canada":{
         "Alberta":{}, "British Columbia":{}, "Manitoba":{}, "New Brunswick":{}, "Newfoundland and Labrador":{}, "Northwest Territories":{}, "Nova Scotia":{}, "Nunavut":{}, "Ontario":{}, "Prince Edward Island":{}, "Quebec":{}, "Saskatchewan":{}, "Yukon Territory":{},
       },
             "Central African Republic":{
           "Bamingui-Bangoran":{}, "Bangui":{}, "Basse-Kotto":{}, "Haute-Kotto":{}, "Haut-Mbomou":{}, "Kemo":{}, "Lobaye":{}, "Mambere-Kadei":{}, "Mbomou":{}, "Nana-Grebizi":{}, "Nana-Mambere":{}, "Ombella-Mpoko":{}, "Ouaka":{}, "Ouham":{}, "Ouham-Pende":{}, "Sangha-Mbaere":{}, "Vakaga":{},
         
         },
       "Chad":{
         "Batha":{}, "Biltine":{}, "Borkou-Ennedi-Tibesti":{}, "Chari-Baguirmi":{}, "Guéra":{}, "Kanem":{}, "Lac":{}, "Logone Occidental":{}, "Logone Oriental":{}, "Mayo-Kebbi":{}, "Moyen-Chari":{}, "Ouaddaï":{}, "Salamat":{}, "Tandjile":{},
       },
   
     
         "Chile":{
           "Aysen":{}, "Antofagasta":{}, "Araucania":{}, "Atacama":{}, "Bio-Bio":{}, "Coquimbo":{}, "O'Higgins":{}, "Los Lagos":{}, "Magallanes y la Antartica Chilena":{}, "Maule":{}, "Santiago Region Metropolitana":{}, "Tarapaca":{}, "Valparaiso":{},
         },
       
       
         "China":{
           "Anhui":{}, "Fujian":{}, "Gansu":{}, "Guangdong":{}, "Guizhou":{}, "Hainan":{}, "Hebei":{}, "Heilongjiang":{}, "Henan":{}, "Hubei":{}, "Hunan":{}, "Jiangsu":{}, "Jiangxi":{}, "Jilin":{}, "Liaoning":{}, "Qinghai":{}, "Shaanxi":{}, "Shandong":{}, "Shanxi":{}, "Sichuan":{}, "Yunnan":{}, "Zhejiang":{}, "Guangxi":{}, "Nei Mongol":{}, "Ningxia":{}, "Xinjiang":{}, "Xizang (Tibet)":{}, "Beijing":{}, "Chongqing":{}, "Shanghai":{}, "Tianjin":{},
         },
        
      
         "Colombia":{
           "Amazonas":{}, "Antioquia":{}, "Arauca":{}, "Atlantico":{}, "Bogota District Capital":{}, "Bolivar":{}, "Boyaca":{}, "Caldas":{}, "Caqueta":{}, "Casanare":{}, "Cauca":{}, "Cesar":{}, "Choco":{}, "Cordoba":{}, "Cundinamarca":{}, "Guainia":{}, "Guaviare":{}, "Huila":{}, "La Guajira":{}, "Magdalena":{}, "Meta":{}, "Narino":{}, "Norte de Santander":{}, "Putumayo":{}, "Quindio":{}, "Risaralda":{}, "San Andres & Providencia":{}, "Santander":{}, "Sucre":{}, "Tolima":{}, "Valle del Cauca":{}, "Vaupes":{}, "Vichada":{},
         },
       
        
      
         "Comoros":{
           "Grande Comore (Njazidja)":{}, "Anjouan (Nzwani)":{}, "Moheli (Mwali)":{},
         },
       
        
      
         "Congo, Democratic Republic":{
           "Bandundu":{}, "Bas-Congo":{}, "Equateur":{}, "Kasai-Occidental":{}, "Kasai-Oriental":{}, "Katanga":{}, "Kinshasa":{}, "Maniema":{}, "Nord-Kivu":{}, "Orientale":{}, "Sud-Kivu":{},
         },
       
         "Congo, Republic of the":{
           "Bouenza":{}, "Brazzaville":{}, "Cuvette":{}, "Cuvette-Ouest":{}, "Kouilou":{}, "Lekoumou":{}, "Likouala":{}, "Niari":{}, "Plateaux":{}, "Pool":{}, "Sangha":{},
         },
       
       
         "Costa Rica":{
           "Alajuela":{}, "Cartago":{}, "Guanacaste":{}, "Heredia":{}, "Limon":{}, "Puntarenas":{}, "San Jose":{},
      },
         
   
         "Cote d Ivoire":{
           "ivory coast":{},
         },
        
      
         "Croatia":{
           "Bjelovarsko-Bilogorska":{}, "Brodsko-Posavska":{}, "Dubrovacko-Neretvanska":{}, "Istarska":{}, "Karlovacka":{}, "Koprivnicko-Krizevacka":{}, "Krapinsko-Zagorska":{}, "Licko-Senjska":{}, "Medimurska":{}, "Osjecko-Baranjska":{}, "Pozesko-Slavonska":{}, "Primorsko-Goranska":{}, "Sibensko-Kninska":{}, "Sisacko-Moslavacka":{}, "Splitsko-Dalmatinska":{}, "Varazdinska":{}, "Viroviticko-Podravska":{}, "Vukovarsko-Srijemska":{}, "Zadarska":{}, "Zagreb":{}, "Zagrebacka":{},
      },
        
      "Cuba":{
       "Camaguey":{}, "Ciego de Avila":{}, "Cienfuegos":{}, "Ciudad de La Habana":{}, "Granma":{}, "Guantanamo":{}, "Holguin":{}, "Isla de la Juventud":{}, "La Habana":{}, "Las Tunas":{}, "Matanzas":{}, "Pinar del Rio":{}, "Sancti Spiritus":{}, "Santiago de Cuba":{}, "Villa Clara":{},
     },
     
     "Cyprus":{
     "Famagusta":{}, "Kyrenia":{}, "Larnaca":{}, "Limassol":{}, "Nicosia":{}, "Paphos":{},
     },
         
     "Czech Republic":{
       "Jihocesky Kraj":{}, "Jihomoravsky Kraj":{}, "Karlovarsky Kraj":{}, "Kralovehradecky Kraj":{}, "Liberecky Kraj":{}, "Moravskoslezsky Kraj":{}, "Olomoucky Kraj":{}, "Pardubicky Kraj":{}, "Plzensky Kraj":{}, "Praha":{}, "Stredocesky Kraj":{}, "Ustecky Kraj":{}, "Vysocina":{}, "Zlinsky Kraj":{},
     },
       
        
     "Denmark":{
       "Arhus":{}, "Bornholm":{}, "Frederiksberg":{}, "Frederiksborg":{}, "Fyn":{}, "Kobenhavn":{}, "Kobenhavns":{}, "Nordjylland":{}, "Ribe":{}, "Ringkobing":{}, "Roskilde":{}, "Sonderjylland":{}, "Storstrom":{}, "Vejle":{}, "Vestsjalland":{}, "Viborg":{},
     },
        
      
         "Djibouti":{
           "Ali Sabih":{}, "Dikhil":{}, "Djibouti":{}, "Obock":{}, "Tadjoura":{},
         },
     
         "Dominica":{
         "Saint Andrew":{}, "Saint David":{}, "Saint George":{}, "Saint John":{}, "Saint Joseph":{}, "Saint Luke":{}, "Saint Mark":{}, "Saint Patrick":{}, "Saint Paul":{}, "Saint Peter":{},
         },
         
        
      
         "Dominican Republic":{
           "Azua":{}, "Baoruco":{}, "Barahona":{}, "Dajabon":{}, "Distrito Nacional":{}, "Duarte":{}, "Elias Pina":{}, "El Seibo":{}, "Espaillat":{}, "Hato Mayor":{}, "Independencia":{}, "La Altagracia":{}, "La Romana":{}, "La Vega":{}, "Maria Trinidad Sanchez":{}, "Monsenor Nouel":{}, "Monte Cristi":{}, "Monte Plata":{}, "Pedernales":{}, "Peravia":{}, "Puerto Plata":{}, "Salcedo":{}, "Samana":{}, "Sanchez Ramirez":{}, "San Cristobal":{}, "San Jose de Ocoa":{}, "San Juan":{}, "San Pedro de Macoris":{}, "Santiago":{}, "Santiago Rodriguez":{}, "Santo Domingo":{}, "Valverde":{},
      },
         "East Timor":{
           "Aileu":{}, "Ainaro":{}, "Baucau":{}, "Bobonaro":{}, "Cova-Lima":{}, "Dili":{}, "Ermera":{}, "Lautem":{}, "Liquica":{}, "Manatuto":{}, "Manufahi":{}, "Oecussi":{}, "Viqueque":{},
         },
       
         "Ecuador":{
         "Azuay":{}, "Bolivar":{}, "Canar":{}, "Carchi":{}, "Chimborazo":{}, "Cotopaxi":{}, "El Oro":{}, "Esmeraldas":{}, "Galapagos":{}, "Guayas":{}, "Imbabura":{}, "Loja":{}, "Los Rios":{}, "Manabi":{}, "Morona-Santiago":{}, "Napo":{}, "Orellana":{}, "Pastaza":{}, "Pichincha":{}, "Sucumbios":{}, "Tungurahua":{}, "Zamora-Chinchipe":{},
         },
       
       
         "Egypt":{
           "Ad Daqahliyah":{}, "Al Bahr al Ahmar":{}, "Al Buhayrah":{}, "Al Fayyum":{}, "Al Gharbiyah":{}, "Al Iskandariyah":{}, "Al Isma'iliyah":{}, "Al Jizah":{}, "Al Minufiyah":{}, "Al Minya":{}, "Al Qahirah":{}, "Al Qalyubiyah":{}, "Al Wadi al Jadid":{}, "Ash Sharqiyah":{}, "As Suways":{}, "Aswan":{}, "Asyut":{}, "Bani Suwayf":{}, "Bur Sa'id":{}, "Dumyat":{}, "Janub Sina'":{}, "Kafr ash Shaykh":{}, "Matruh":{}, "Qina":{}, "Shamal Sina'":{}, "Suhaj":{},
      },
       
        
      
         "El Salvador":{
         "Ahuachapan":{}, "Cabanas":{}, "Chalatenango":{}, "Cuscatlan":{}, "La Libertad":{}, "La Paz":{}, "La Union":{}, "Morazan":{}, "San Miguel":{}, "San Salvador":{}, "Santa Ana":{}, "San Vicente":{}, "Sonsonate":{}, "Usulutan":{},
         },
         
         "Equatorial Guinea":{
           "Annobon":{}, "Bioko Norte":{}, "Bioko Sur":{}, "Centro Sur":{}, "Kie-Ntem":{}, "Litoral":{}, "Wele-Nzas":{},
         },
     
         "Eritrea":{
           "Anseba":{}, "Debub":{}, "Debubawi K'eyih Bahri":{}, "Gash Barka":{}, "Ma'akel":{}, "Semenawi Keyih Bahri":{},
         },
       
         "Estonia":{
           "Harjumaa (Tallinn)":{}, "Hiiumaa (Kardla)":{}, "Ida-Virumaa (Johvi)":{}, "Jarvamaa (Paide)":{}, "Jogevamaa (Jogeva)":{}, "Laanemaa (Haapsalu)":{}, "Laane-Virumaa (Rakvere)":{}, "Parnumaa (Parnu)":{}, "Polvamaa (Polva)":{}, "Raplamaa (Rapla)":{}, "Saaremaa (Kuressaare)":{}, "Tartumaa (Tartu)":{}, "Valgamaa (Valga)":{}, "Viljandimaa (Viljandi)":{}, "Vorumaa (Voru)":{},
      },
       
         "Ethiopia":{
           "Addis Ababa":{}, "Afar":{}, "Amhara":{}, "Binshangul Gumuz":{}, "Dire Dawa":{}, "Gambela Hizboch":{}, "Harari":{}, "Oromia":{}, "Somali":{}, "Tigray":{}, "Southern Nations, Nationalities, and Peoples Region":{},
         },
       
         "Fiji":{
           "Central (Suva)":{}, "Eastern (Levuka)":{}, "Northern (Labasa)":{}, "Rotuma":{}, "Western (Lautoka)":{},
      },
        
         "Finland":{
           "Aland":{}, "Etela-Suomen Laani":{}, "Ita-Suomen Laani":{}, "Lansi-Suomen Laani":{}, "Lappi":{}, "Oulun Laani":{},
         },
       
         "France":{
           "Alsace":{}, "Aquitaine":{}, "Auvergne":{}, "Basse-Normandie":{}, "Bourgogne":{}, "Bretagne":{}, "Centre":{}, "Champagne-Ardenne":{}, "Corse":{}, "Franche-Comte":{}, "Haute-Normandie":{}, "Ile-de-France":{}, "Languedoc-Roussillon":{}, "Limousin":{}, "Lorraine":{}, "Midi-Pyrenees":{}, "Nord-Pas-de-Calais":{}, "Pays de la Loire":{}, "Picardie":{}, "Poitou-Charentes":{}, "Provence-Alpes-Cote d'Azur":{}, "Rhone-Alpes":{},
      },
         
         "Gabon":{
           "Estuaire":{}, "Haut-Ogooue":{}, "Moyen-Ogooue":{}, "Ngounie":{}, "Nyanga":{}, "Ogooue-Ivindo":{}, "Ogooue-Lolo":{}, "Ogooue-Maritime":{}, "Woleu-Ntem":{},
         },
         
         "Gambia":{
           "Banjul":{}, "Central River":{}, "Lower River":{}, "North Bank":{}, "Upper River":{}, "Western":{},
         },
         
         "Georgia":{
         },
         "Germany":{
           "Baden-Wuerttemberg":{}, "Bayern":{}, "Berlin":{}, "Brandenburg":{}, "Bremen":{}, "Hamburg":{}, "Hessen":{}, "Mecklenburg-Vorpommern":{}, "Niedersachsen":{}, "Nordrhein-Westfalen":{}, "Rheinland-Pfalz":{}, "Saarland":{}, "Sachsen":{}, "Sachsen-Anhalt":{}, "Schleswig-Holstein":{}, "Thueringen":{},
         },
   
         "Ghana":{
           "Ashanti":{}, "Brong-Ahafo":{}, "Central":{}, "Eastern":{}, "Greater Accra":{}, "Northern":{}, "Upper East":{}, "Upper West":{}, "Volta":{}, "Western":{},
         },
         
         "Greece":{
           "Agion Oros":{}, "Achaia":{}, "Aitolia kai Akarmania":{}, "Argolis":{}, "Arkadia":{}, "Arta":{}, "Attiki":{}, "Chalkidiki":{}, "Chanion":{}, "Chios":{}, "Dodekanisos":{}, "Drama":{}, "Evros":{}, "Evrytania":{}, "Evvoia":{}, "Florina":{}, "Fokidos":{}, "Fthiotis":{}, "Grevena":{}, "Ileia":{}, "Imathia":{}, "Ioannina":{}, "Irakleion":{}, "Karditsa":{}, "Kastoria":{}, "Kavala":{}, "Kefallinia":{}, "Kerkyra":{}, "Kilkis":{}, "Korinthia":{}, "Kozani":{}, "Kyklades":{}, "Lakonia":{}, "Larisa":{}, "Lasithi":{}, "Lefkas":{}, "Lesvos":{}, "Magnisia":{}, "Messinia":{}, "Pella":{}, "Pieria":{}, "Preveza":{}, "Rethynnis":{}, "Rodopi":{}, "Samos":{}, "Serrai":{}, "Thesprotia":{}, "Thessaloniki":{}, "Trikala":{}, "Voiotia":{}, "Xanthi":{}, "Zakynthos":{},
         },
         
         "Greenland":{
           "Avannaa (Nordgronland)":{}, "Tunu (Ostgronland)":{}, "Kitaa (Vestgronland)":{},
         },
         
         "Grenada":{
           "Carriacou and Petit Martinique":{}, "Saint Andrew":{}, "Saint David":{}, "Saint George":{}, "Saint John":{}, "Saint Mark":{}, "Saint Patrick":{},
         },
   
         "Guatemala":{
           "Alta Verapaz":{}, "Baja Verapaz":{}, "Chimaltenango":{}, "Chiquimula":{}, "El Progreso":{}, "Escuintla":{}, "Guatemala":{}, "Huehuetenango":{}, "Izabal":{}, "Jalapa":{}, "Jutiapa":{}, "Peten":{}, "Quetzaltenango":{}, "Quiche":{}, "Retalhuleu":{}, "Sacatepequez":{}, "San Marcos":{}, "Santa Rosa":{}, "Solola":{}, "Suchitepequez":{}, "Totonicapan":{}, "Zacapa":{},
         },
         
         "Guinea":{
           "Beyla":{}, "Boffa":{}, "Boke":{}, "Conakry":{}, "Coyah":{}, "Dabola":{}, "Dalaba":{}, "Dinguiraye":{}, "Dubreka":{}, "Faranah":{}, "Forecariah":{}, "Fria":{}, "Gaoual":{}, "Gueckedou":{}, "Kankan":{}, "Kerouane":{}, "Kindia":{}, "Kissidougou":{}, "Koubia":{}, "Koundara":{}, "Kouroussa":{}, "Labe":{}, "Lelouma":{}, "Lola":{}, "Macenta":{}, "Mali":{}, "Mamou":{}, "Mandiana":{}, "Nzerekore":{}, "Pita":{}, "Siguiri":{}, "Telimele":{}, "Tougue":{}, "Yomou":{},
         },
         
         "Guinea-Bissau":{
           "Bafata":{}, "Biombo":{}, "Bissau":{}, "Bolama":{}, "Cacheu":{}, "Gabu":{}, "Oio":{}, "Quinara":{}, "Tombali":{},
         },
        
         "Guyana":{
           "Barima-Waini":{}, "Cuyuni-Mazaruni":{}, "Demerara-Mahaica":{}, "East Berbice-Corentyne":{}, "Essequibo Islands-West Demerara":{}, "Mahaica-Berbice":{}, "Pomeroon-Supenaam":{}, "Potaro-Siparuni":{}, "Upper Demerara-Berbice":{}, "Upper Takutu-Upper Essequibo":{},
         },
        
         "Haiti":{
         "Artibonite":{}, "Centre":{}, "Grand 'Anse":{}, "Nord":{}, "Nord-Est":{}, "Nord-Ouest":{}, "Ouest":{}, "Sud":{}, "Sud-Est":{},
         },
        
      
        "Honduras":{
         "Atlantida":{}, "Choluteca":{}, "Colon":{}, "Comayagua":{}, "Copan":{}, "Cortes":{}, "El Paraiso":{}, "Francisco Morazan":{}, "Gracias a Dios":{}, "Intibuca":{}, "Islas de la Bahia":{}, "La Paz":{}, "Lempira":{}, "Ocotepeque":{}, "Olancho":{}, "Santa Barbara":{}, "Valle":{}, "Yoro":{},
       },
       
         "Hong Kong":{
           "hong kong":{},
         },
         "Hungary":{
           "Bacs-Kiskun":{}, "Baranya":{}, "Bekes":{}, "Borsod-Abauj-Zemplen":{}, "Csongrad":{}, "Fejer":{}, "Gyor-Moson-Sopron":{}, "Hajdu-Bihar":{}, "Heves":{}, "Jasz-Nagykun-Szolnok":{}, "Komarom-Esztergom":{}, "Nograd":{}, "Pest":{}, "Somogy":{}, "Szabolcs-Szatmar-Bereg":{}, "Tolna":{}, "Vas":{}, "Veszprem":{}, "Zala":{}, "Bekescsaba":{}, "Debrecen":{}, "Dunaujvaros":{}, "Eger":{}, "Gyor":{}, "Hodmezovasarhely":{}, "Kaposvar":{}, "Kecskemet":{}, "Miskolc":{}, "Nagykanizsa":{}, "Nyiregyhaza":{}, "Pecs":{}, "Sopron":{}, "Szeged":{}, "Szekesfehervar":{}, "Szolnok":{}, "Szombathely":{}, "Tatabanya":{}, "Veszprem":{}, "Zalaegerszeg":{},
         },
       
         "Iceland":{
           "Austurland":{}, "Hofudhborgarsvaedhi":{}, "Nordhurland Eystra":{}, "Nordhurland Vestra":{}, "Sudhurland":{}, "Sudhurnes":{}, "Vestfirdhir":{}, "Vesturland":{},
         }, 
        
         "India":{
           "Andaman and Nicobar Islands":{}, "Andhra Pradesh":{}, "Arunachal Pradesh":{}, "Assam":{}, "Bihar":{}, "Chandigarh":{}, "Chhattisgarh":{}, "Dadra and Nagar Haveli":{}, "Daman and Diu":{}, "Delhi":{}, "Goa":{}, "Gujarat":{}, "Haryana":{}, "Himachal Pradesh":{}, "Jammu and Kashmir":{}, "Jharkhand":{}, "Karnataka":{}, "Kerala":{}, "Lakshadweep":{}, "Madhya Pradesh":{}, "Maharashtra":{}, "Manipur":{}, "Meghalaya":{}, "Mizoram":{}, "Nagaland":{}, "Orissa":{}, "Pondicherry":{}, "Punjab":{}, "Rajasthan":{}, "Sikkim":{},"Telangana":{}, "Tamil Nadu":{}, "Tripura":{}, "Uttaranchal":{}, "Uttar Pradesh":{}, "West Bengal":{},
         },
        
         "Indonesia":{
           "Aceh":{}, "Bali":{}, "Banten":{}, "Bengkulu":{}, "Gorontalo":{}, "Irian Jaya Barat":{}, "Jakarta Raya":{}, "Jambi":{}, "Jawa Barat":{}, "Jawa Tengah":{}, "Jawa Timur":{}, "Kalimantan Barat":{}, "Kalimantan Selatan":{}, "Kalimantan Tengah":{}, "Kalimantan Timur":{}, "Kepulauan Bangka Belitung":{}, "Kepulauan Riau":{}, "Lampung":{}, "Maluku":{}, "Maluku Utara":{}, "Nusa Tenggara Barat":{}, "Nusa Tenggara Timur":{}, "Papua":{}, "Riau":{}, "Sulawesi Barat":{}, "Sulawesi Selatan":{}, "Sulawesi Tengah":{}, "Sulawesi Tenggara":{}, "Sulawesi Utara":{}, "Sumatera Barat":{}, "Sumatera Selatan":{}, "Sumatera Utara":{}, "Yogyakarta":{},
         },
       
         "Iran":{
           "Ardabil":{}, "Azarbayjan-e Gharbi":{}, "Azarbayjan-e Sharqi":{}, "Bushehr":{}, "Chahar Mahall va Bakhtiari":{}, "Esfahan":{}, "Fars":{}, "Gilan":{}, "Golestan":{}, "Hamadan":{}, "Hormozgan":{}, "Ilam":{}, "Kerman":{}, "Kermanshah":{}, "Khorasan-e Janubi":{}, "Khorasan-e Razavi":{}, "Khorasan-e Shemali":{}, "Khuzestan":{}, "Kohgiluyeh va Buyer Ahmad":{}, "Kordestan":{}, "Lorestan":{}, "Markazi":{}, "Mazandaran":{}, "Qazvin":{}, "Qom":{}, "Semnan":{}, "Sistan va Baluchestan":{}, "Tehran":{}, "Yazd":{}, "Zanjan":{},
         },
      
         "Iraq":{
           "Al Anbar":{}, "Al Basrah":{}, "Al Muthanna":{}, "Al Qadisiyah":{}, "An Najaf":{}, "Arbil":{}, "As Sulaymaniyah":{}, "At Ta'mim":{}, "Babil":{}, "Baghdad":{}, "Dahuk":{}, "Dhi Qar":{}, "Diyala":{}, "Karbala'":{}, "Maysan":{}, "Ninawa":{}, "Salah ad Din":{}, "Wasit":{},
         },
         
         "Ireland":{
           "Carlow":{}, "Cavan":{}, "Clare":{}, "Cork":{}, "Donegal":{}, "Dublin":{}, "Galway":{}, "Kerry":{}, "Kildare":{}, "Kilkenny":{}, "Laois":{}, "Leitrim":{}, "Limerick":{}, "Longford":{}, "Louth":{}, "Mayo":{}, "Meath":{}, "Monaghan":{}, "Offaly":{}, "Roscommon":{}, "Sligo":{}, "Tipperary":{}, "Waterford":{}, "Westmeath":{}, "Wexford":{}, "Wicklow":{},
         },
       
       
      
         "Israel":{
           "Central":{}, "Haifa":{}, "Jerusalem":{}, "Northern":{}, "Southern":{}, "Tel Aviv":{},
         },
       
         "Italy":{
           "Abruzzo":{}, "Basilicata":{}, "Calabria":{}, "Campania":{}, "Emilia-Romagna":{}, "Friuli-Venezia Giulia":{}, "Lazio":{}, "Liguria":{}, "Lombardia":{}, "Marche":{}, "Molise":{}, "Piemonte":{}, "Puglia":{}, "Sardegna":{}, "Sicilia":{}, "Toscana":{}, "Trentino-Alto Adige":{}, "Umbria":{}, "Valle d'Aosta":{}, "Veneto":{},
         },
        
      
         "Jamaica":{
           "Clarendon":{}, "Hanover":{}, "Kingston":{}, "Manchester":{}, "Portland":{}, "Saint Andrew":{}, "Saint Ann":{}, "Saint Catherine":{}, "Saint Elizabeth":{}, "Saint James":{}, "Saint Mary":{}, "Saint Thomas":{}, "Trelawny":{}, "Westmoreland":{},
         },
         "Japan":{
           "Aichi":{}, "Akita":{}, "Aomori":{}, "Chiba":{}, "Ehime":{}, "Fukui":{}, "Fukuoka":{}, "Fukushima":{}, "Gifu":{}, "Gumma":{}, "Hiroshima":{}, "Hokkaido":{}, "Hyogo":{}, "Ibaraki":{}, "Ishikawa":{}, "Iwate":{}, "Kagawa":{}, "Kagoshima":{}, "Kanagawa":{}, "Kochi":{}, "Kumamoto":{}, "Kyoto":{}, "Mie":{}, "Miyagi":{}, "Miyazaki":{}, "Nagano":{}, "Nagasaki":{}, "Nara":{}, "Niigata":{}, "Oita":{}, "Okayama":{}, "Okinawa":{}, "Osaka":{}, "Saga":{}, "Saitama":{}, "Shiga":{}, "Shimane":{}, "Shizuoka":{}, "Tochigi":{}, "Tokushima":{}, "Tokyo":{}, "Tottori":{}, "Toyama":{}, "Wakayama":{}, "Yamagata":{}, "Yamaguchi":{}, "Yamanashi":{}
         },
   
         "Jordan":{
           "Ajlun":{}, "Al 'Aqabah":{}, "Al Balqa'":{}, "Al Karak":{}, "Al Mafraq":{}, "'Amman":{}, "At Tafilah":{}, "Az Zarqa'":{}, "Irbid":{}, "Jarash":{}, "Ma'an":{}, "Madaba":{},
         },
       
        
      
         "Kazakhstan":{
           "Almaty Oblysy":{}, "Aqmola Oblysy":{}, "Aqtobe Oblysy":{}, "Astana Qalasy":{}, "Atyrau Oblysy":{}, "Batys Qazaqstan Oblysy":{}, "Bayqongyr Qalasy":{}, "Mangghystau Oblysy":{}, "Ongtustik Qazaqstan Oblysy":{}, "Pavlodar Oblysy":{}, "Qaraghandy Oblysy":{}, "Qostanay Oblysy":{}, "Qyzylorda Oblysy":{}, "Shyghys Qazaqstan Oblysy":{}, "Soltustik Qazaqstan Oblysy":{}, "Zhambyl Oblysy":{},
                     },
        
         "Kenya":{
           "Central":{}, "Coast":{}, "Eastern":{}, "Nairobi Area":{}, "North Eastern":{}, "Nyanza":{}, "Rift Valley":{}, "Western":{},
      
         },
         "Kiribati":{
   "kiribati":{},
         },
         " North Korea":{
           "Chagang":{}, "North Hamgyong":{}, "South Hamgyong":{}, "North Hwanghae":{}, "South Hwanghae":{}, "Kangwon":{}, "North P'yongan":{}, "South P'yongan":{}, "Yanggang":{}, "Kaesong":{}, "Najin":{}, "Namp'o":{}, "Pyongyang":{},
      },
         "South Korea":{
           "Seoul":{}, "Busan City":{}, "Daegu City":{}, "Incheon City":{}, "Gwangju City":{}, "Daejeon City":{}, "Ulsan":{}, "Gyeonggi Province":{}, "Gangwon Province":{}, "North Chungcheong Province":{}, "South Chungcheong Province":{}, "North Jeolla Province":{}, "South Jeolla Province":{}, "North Gyeongsang Province":{}, "South Gyeongsang Province":{}, "Jeju":{},
         },
      
         "Kuwait":{
           "Al Ahmadi":{}, "Al Farwaniyah":{}, "Al Asimah":{}, "Al Jahra":{}, "Hawalli":{}, "Mubarak Al-Kabeer":{},
         },
       
         "Kyrgyzstan":{
       "Batken Oblasty":{}, "Bishkek Shaary":{}, "Chuy Oblasty":{}, "Jalal-Abad Oblasty":{}, "Naryn Oblasty":{}, "Osh Oblasty":{}, "Talas Oblasty":{}, "Ysyk-Kol Oblasty":{},
      },
      
         "Laos":{
           "Attapu":{}, "Bokeo":{}, "Bolikhamxai":{}, "Champasak":{}, "Houaphan":{}, "Khammouan":{}, "Louangnamtha":{}, "Louangphrabang":{}, "Oudomxai":{}, "Phongsali":{}, "Salavan":{}, "Savannakhet":{}, "Viangchan":{}, "Viangchan":{}, "Xaignabouli":{}, "Xaisomboun":{}, "Xekong":{}, "Xiangkhoang":{},
         },
        
         "Latvia":{
           "Aizkraukles Rajons":{}, "Aluksnes Rajons":{}, "Balvu Rajons":{}, "Bauskas Rajons":{}, "Cesu Rajons":{}, "Daugavpils":{}, "Daugavpils Rajons":{}, "Dobeles Rajons":{}, "Gulbenes Rajons":{}, "Jekabpils Rajons":{}, "Jelgava":{}, "Jelgavas Rajons":{}, "Jurmala":{}, "Kraslavas Rajons":{}, "Kuldigas Rajons":{}, "Liepaja":{}, "Liepajas Rajons":{}, "Limbazu Rajons":{}, "Ludzas Rajons":{}, "Madonas Rajons":{}, "Ogres Rajons":{}, "Preilu Rajons":{}, "Rezekne":{}, "Rezeknes Rajons":{}, "Riga":{}, "Rigas Rajons":{}, "Saldus Rajons":{}, "Talsu Rajons":{}, "Tukuma Rajons":{}, "Valkas Rajons":{}, "Valmieras Rajons":{}, "Ventspils":{}, "Ventspils Rajons":{},
         },
        
      
         "Lebanon":{
           "Beyrouth":{}, "Beqaa":{}, "Liban-Nord":{}, "Liban-Sud":{}, "Mont-Liban":{}, "Nabatiye":{},
         },
         
        
      
         "Lesotho":{
           "Berea":{}, "Butha-Buthe":{}, "Leribe":{}, "Mafeteng":{}, "Maseru":{}, "Mohale's Hoek":{}, "Mokhotlong":{}, "Qacha's Nek":{}, "Quthing":{}, "Thaba-Tseka":{},
         },
        
      
         "Liberia":{
           "Bomi":{}, "Bong":{}, "Gbarpolu":{}, "Grand Bassa":{}, "Grand Cape Mount":{}, "Grand Gedeh":{}, "Grand Kru":{}, "Lofa":{}, "Margibi":{}, "Maryland":{}, "Montserrado":{}, "Nimba":{}, "River Cess":{}, "River Gee":{}, "Sinoe":{},
         },
        
      
         "Libya":{
           "Ajdabiya":{}, "Al 'Aziziyah":{}, "Al Fatih":{}, "Al Jabal al Akhdar":{}, "Al Jufrah":{}, "Al Khums":{}, "Al Kufrah":{}, "An Nuqat al Khams":{}, "Ash Shati'":{}, "Awbari":{}, "Az Zawiyah":{}, "Banghazi":{}, "Darnah":{}, "Ghadamis":{}, "Gharyan":{}, "Misratah":{}, "Murzuq":{}, "Sabha":{}, "Sawfajjin":{}, "Surt":{}, "Tarabulus":{}, "Tarhunah":{}, "Tubruq":{}, "Yafran":{}, "Zlitan":{},
         },
       
         "Liechtenstein":{
           "Balzers":{}, "Eschen":{}, "Gamprin":{}, "Mauren":{}, "Planken":{}, "Ruggell":{}, "Schaan":{}, "Schellenberg":{}, "Triesen":{}, "Triesenberg":{}, "Vaduz":{},
         },
     
         "Lithuania":{
           "Alytaus":{}, "Kauno":{}, "Klaipedos":{}, "Marijampoles":{}, "Panevezio":{}, "Siauliu":{}, "Taurages":{}, "Telsiu":{}, "Utenos":{}, "Vilniaus":{},
         },
       
         "Luxembourg":{
           "Diekirch":{}, "Grevenmacher":{}, "Luxembourg":{}
         },
        
     
      
         "Macedonia":{
           "Aerodrom":{}, "Aracinovo":{}, "Berovo":{}, "Bitola":{}, "Bogdanci":{}, "Bogovinje":{}, "Bosilovo":{}, "Brvenica":{}, "Butel":{}, "Cair":{}, "Caska":{}, "Centar":{}, "Centar Zupa":{}, "Cesinovo":{}, "Cucer-Sandevo":{}, "Debar":{}, "Debartsa":{}, "Delcevo":{}, "Demir Hisar":{}, "Demir Kapija":{}, "Dojran":{}, "Dolneni":{}, "Drugovo":{}, "Gazi Baba":{}, "Gevgelija":{}, "Gjorce Petrov":{}, "Gostivar":{}, "Gradsko":{}, "Ilinden":{}, "Jegunovce":{}, "Karbinci":{}, "Karpos":{}, "Kavadarci":{}, "Kicevo":{}, "Kisela Voda":{}, "Kocani":{}, "Konce":{}, "Kratovo":{}, "Kriva Palanka":{}, "Krivogastani":{}, "Krusevo":{}, "Kumanovo":{}, "Lipkovo":{}, "Lozovo":{}, "Makedonska Kamenica":{}, "Makedonski Brod":{}, "Mavrovo i Rastusa":{}, "Mogila":{}, "Negotino":{}, "Novaci":{}, "Novo Selo":{}, "Ohrid":{}, "Oslomej":{}, "Pehcevo":{}, "Petrovec":{}, "Plasnica":{}, "Prilep":{}, "Probistip":{}, "Radovis":{}, "Rankovce":{}, "Resen":{}, "Rosoman":{}, "Saraj":{}, "Skopje":{}, "Sopiste":{}, "Staro Nagoricane":{}, "Stip":{}, "Struga":{}, "Strumica":{}, "Studenicani":{}, "Suto Orizari":{}, "Sveti Nikole":{}, "Tearce":{}, "Tetovo":{}, "Valandovo":{}, "Vasilevo":{}, "Veles":{}, "Vevcani":{}, "Vinica":{}, "Vranestica":{}, "Vrapciste":{}, "Zajas":{}, "Zelenikovo":{}, "Zelino":{}, "Zrnovci":{},
         },
         
        
         "Madagascar":{
           "Antananarivo":{}, "Antsiranana":{}, "Fianarantsoa":{}, "Mahajanga":{}, "Toamasina":{}, "Toliara":{},
         },
       
         "Malawi":{
           "Balaka":{}, "Blantyre":{}, "Chikwawa":{}, "Chiradzulu":{}, "Chitipa":{}, "Dedza":{}, "Dowa":{}, "Karonga":{}, "Kasungu":{}, "Likoma":{}, "Lilongwe":{}, "Machinga":{}, "Mangochi":{}, "Mchinji":{}, "Mulanje":{}, "Mwanza":{}, "Mzimba":{}, "Ntcheu":{}, "Nkhata Bay":{}, "Nkhotakota":{}, "Nsanje":{}, "Ntchisi":{}, "Phalombe":{}, "Rumphi":{}, "Salima":{}, "Thyolo":{}, "Zomba":{},
         },
         
         "Malaysia":{
           "Johor":{}, "Kedah":{}, "Kelantan":{}, "Kuala Lumpur":{}, "Labuan":{}, "Malacca":{}, "Negeri Sembilan":{}, "Pahang":{}, "Perak":{}, "Perlis":{}, "Penang":{}, "Sabah":{}, "Sarawak":{}, "Selangor":{}, "Terengganu":{},
         },
         
         "Maldives":{
           "Alifu":{}, "Baa":{}, "Dhaalu":{}, "Faafu":{}, "Gaafu Alifu":{}, "Gaafu Dhaalu":{}, "Gnaviyani":{}, "Haa Alifu":{}, "Haa Dhaalu":{}, "Kaafu":{}, "Laamu":{}, "Lhaviyani":{}, "Maale":{}, "Meemu":{}, "Noonu":{}, "Raa":{}, "Seenu":{}, "Shaviyani":{}, "Thaa":{}, "Vaavu":{},
         },
        
         "Mali":{
           "Bamako (Capital)":{}, "Gao":{}, "Kayes":{}, "Kidal":{}, "Koulikoro":{}, "Mopti":{}, "Segou":{}, "Sikasso":{}, "Tombouctou":{},
       },
       
         "Malta":{
   "Birgu":{},"Bormla":{},"Mdina":{},"Rabat":{},"Sanglea":{},"Siggiewi":{},"Qormi":{},"Valleta":{},"Zabbar":{},"Zebbug":{},"Zejtun":{},
         },
       
         "Marshall Islands":{
   "marshall islands":{},
         },
        
         "Mauritania":{
           "Adrar":{}, "Assaba":{}, "Brakna":{}, "Dakhlet Nouadhibou":{}, "Gorgol":{}, "Guidimaka":{}, "Hodh Ech Chargui":{}, "Hodh El Gharbi":{}, "Inchiri":{}, "Nouakchott":{}, "Tagant":{}, "Tiris Zemmour":{}, "Trarza":{},
         },
         
         "Mauritius":{
           "Agalega Islands":{}, "Black River":{}, "Cargados Carajos Shoals":{}, "Flacq":{}, "Grand Port":{}, "Moka":{}, "Pamplemousses":{}, "Plaines Wilhems":{}, "Port Louis":{}, "Riviere du Rempart":{}, "Rodrigues":{}, "Savanne":{},
         },
         "Mayotte":{
          "Mayotte":{},
         },
       
         "Mexico":{
           "Aguascalientes":{}, "Baja California":{}, "Baja California Sur":{}, "Campeche":{}, "Chiapas":{}, "Chihuahua":{}, "Coahuila de Zaragoza":{}, "Colima":{}, "Distrito Federal":{}, "Durango":{}, "Guanajuato":{}, "Guerrero":{}, "Hidalgo":{}, "Jalisco":{}, "Mexico":{}, "Michoacan de Ocampo":{}, "Morelos":{}, "Nayarit":{}, "Nuevo Leon":{}, "Oaxaca":{}, "Puebla":{}, "Queretaro de Arteaga":{}, "Quintana Roo":{}, "San Luis Potosi":{}, "Sinaloa":{}, "Sonora":{}, "Tabasco":{}, "Tamaulipas":{}, "Tlaxcala":{}, "Veracruz-Llave":{}, "Yucatan":{}, "Zacatecas":{},
         },
         
         "Micronesia":{
   "micronesia":{},
         },
        
         "Moldova":{
           "Anenii Noi":{}, "Basarabeasca":{}, "Briceni":{}, "Cahul":{}, "Cantemir":{}, "Calarasi":{}, "Causeni":{}, "Cimislia":{}, "Criuleni":{}, "Donduseni":{}, "Drochia":{}, "Dubasari":{}, "Edinet":{}, "Falesti":{}, "Floresti":{}, "Glodeni":{}, "Hincesti":{}, "Ialoveni":{}, "Leova":{}, "Nisporeni":{}, "Ocnita":{}, "Orhei":{}, "Rezina":{}, "Riscani":{}, "Singerei":{}, "Soldanesti":{}, "Soroca":{}, "Stefan-Voda":{}, "Straseni":{}, "Taraclia":{}, "Telenesti":{}, "Ungheni":{}, "Balti":{}, "Bender":{}, "Chisinau":{}, "Gagauzia":{}, "Stinga Nistrului":{},
         },
         
         "Mongolia":{
           "Arhangay":{}, "Bayanhongor":{}, "Bayan-Olgiy":{}, "Bulgan":{}, "Darhan Uul":{}, "Dornod":{}, "Dornogovi":{}, "Dundgovi":{}, "Dzavhan":{}, "Govi-Altay":{}, "Govi-Sumber":{}, "Hentiy":{}, "Hovd":{}, "Hovsgol":{}, "Omnogovi":{}, "Orhon":{}, "Ovorhangay":{}, "Selenge":{}, "Suhbaatar":{}, "Tov":{}, "Ulaanbaatar":{}, "Uvs":{},
         },
         
         "Morocco":{
           "Agadir":{}, "Al Hoceima":{}, "Azilal":{}, "Beni Mellal":{}, "Ben Slimane":{}, "Boulemane":{}, "Casablanca":{}, "Chaouen":{}, "El Jadida":{}, "El Kelaa des Sraghna":{}, "Er Rachidia":{}, "Essaouira":{}, "Fes":{}, "Figuig":{}, "Guelmim":{}, "Ifrane":{}, "Kenitra":{}, "Khemisset":{}, "Khenifra":{}, "Khouribga":{}, "Laayoune":{}, "Larache":{}, "Marrakech":{}, "Meknes":{}, "Nador":{}, "Ouarzazate":{}, "Oujda":{}, "Rabat-Sale":{}, "Safi":{}, "Settat":{}, "Sidi Kacem":{}, "Tangier":{}, "Tan-Tan":{}, "Taounate":{}, "Taroudannt":{}, "Tata":{}, "Taza":{}, "Tetouan":{}, "Tiznit":{},
         },
         
         "Monaco":{
          "Fontvieille":{},
          "La Condamine":{},
          "Monaco":{},
          "Moneghetti":{},
          "Monte-carlo":{},
          "Saint-roman":{},
         },
         "Mozambique":{
           "Cabo Delgado":{}, "Gaza":{}, "Inhambane":{}, "Manica":{}, "Maputo":{}, "Cidade de Maputo":{}, "Nampula":{}, "Niassa":{}, "Sofala":{}, "Tete":{}, "Zambezia":{},
         },
   
         "Namibia":{
           "Caprivi":{}, "Erongo":{}, "Hardap":{}, "Karas":{}, "Khomas":{}, "Kunene":{}, "Ohangwena":{}, "Okavango":{}, "Omaheke":{}, "Omusati":{}, "Oshana":{}, "Oshikoto":{}, "Otjozondjupa":{},
         },
         
         "Nauru":{
          "Nauru":{},
         },
         "Northern Mariana Islands":{
          "Northern Mariana Islands":{}
         },
      
         "Nepal":{
        "Bagmati":{}, "Bheri":{}, "Dhawalagiri":{}, "Gandaki":{}, "Janakpur":{}, "Karnali":{}, "Kosi":{}, "Lumbini":{}, "Mahakali":{}, "Mechi":{}, "Narayani":{}, "Rapti":{}, "Sagarmatha":{}, "Seti":{},
         },
      
         "Netherlands":{
           "Drenthe":{}, "Flevoland":{}, "Friesland":{}, "Gelderland":{}, "Groningen":{}, "Limburg":{}, "Noord-Brabant":{}, "Noord-Holland":{}, "Overijssel":{}, "Utrecht":{}, "Zeeland":{}, "Zuid-Holland":{},
         },
         
         "New Zealand":{
           "Auckland":{}, "Bay of Plenty":{}, "Canterbury":{}, "Chatham Islands":{}, "Gisborne":{}, "Hawke's Bay":{}, "Manawatu-Wanganui":{}, "Marlborough":{}, "Nelson":{}, "Northland":{}, "Otago":{}, "Southland":{}, "Taranaki":{}, "Tasman":{}, "Waikato":{}, "Wellington":{}, "West Coast":{},
         },
         
         "Nicaragua":{
           "Atlantico Norte":{}, "Atlantico Sur":{}, "Boaco":{}, "Carazo":{}, "Chinandega":{}, "Chontales":{}, "Esteli":{}, "Granada":{}, "Jinotega":{}, "Leon":{}, "Madriz":{}, "Managua":{}, "Masaya":{}, "Matagalpa":{}, "Nueva Segovia":{}, "Rio San Juan":{}, "Rivas":{},
         },
         
         "Niger":{
           "Agadez":{}, "Diffa":{}, "Dosso":{}, "Maradi":{}, "Niamey":{}, "Tahoua":{}, "Tillaberi":{}, "Zinder":{},
         },
         
         "Nigeria":{
           "Abia":{}, "Abuja Federal Capital":{}, "Adamawa":{}, "Akwa Ibom":{}, "Anambra":{}, "Bauchi":{}, "Bayelsa":{}, "Benue":{}, "Borno":{}, "Cross River":{}, "Delta":{}, "Ebonyi":{}, "Edo":{}, "Ekiti":{}, "Enugu":{}, "Gombe":{}, "Imo":{}, "Jigawa":{}, "Kaduna":{}, "Kano":{}, "Katsina":{}, "Kebbi":{}, "Kogi":{}, "Kwara":{}, "Lagos":{}, "Nassarawa":{}, "Niger":{}, "Ogun":{}, "Ondo":{}, "Osun":{}, "Oyo":{}, "Plateau":{}, "Rivers":{}, "Sokoto":{}, "Taraba":{}, "Yobe":{}, "Zamfara":{},
         },
         
         "Norway":{
           "Akershus":{}, "Aust-Agder":{}, "Buskerud":{}, "Finnmark":{}, "Hedmark":{}, "Hordaland":{}, "More og Romsdal":{}, "Nordland":{}, "Nord-Trondelag":{}, "Oppland":{}, "Oslo":{}, "Ostfold":{}, "Rogaland":{}, "Sogn og Fjordane":{}, "Sor-Trondelag":{}, "Telemark":{}, "Troms":{}, "Vest-Agder":{}, "Vestfold":{},
         },
   
         "Oman":{
           "Ad Dakhiliyah":{}, "Al Batinah":{}, "Al Wusta":{}, "Ash Sharqiyah":{}, "Az Zahirah":{}, "Masqat":{}, "Musandam":{}, "Dhofar":{},
         },
         
         "Pakistan":{
           "Balochistan":{}, "North-West Frontier Province":{}, "Punjab":{}, "Sindh":{}, "Islamabad Capital Territory":{}, "Federally Administered Tribal Areas":{},
         },
         "Palestine":{
          "Palestine":{},
         },
        
         "Panama":{
           "Bocas del Toro":{}, "Chiriqui":{}, "Cocle":{}, "Colon":{}, "Darien":{}, "Herrera":{}, "Los Santos":{}, "Panama":{}, "San Blas":{}, "Veraguas":{},
         },
        
         "Papua New Guinea":{
           "Bougainville":{}, "Central":{}, "Chimbu":{}, "Eastern Highlands":{}, "East New Britain":{}, "East Sepik":{}, "Enga":{}, "Gulf":{}, "Madang":{}, "Manus":{}, "Milne Bay":{}, "Morobe":{}, "National Capital":{}, "New Ireland":{}, "Northern":{}, "Sandaun":{}, "Southern Highlands":{}, "Western":{}, "Western Highlands":{}, "West New Britain":{},
         },
         "Paraguay":{
           "Alto Paraguay":{}, "Alto Parana":{}, "Amambay":{}, "Asuncion":{}, "Boqueron":{}, "Caaguazu":{}, "Caazapa":{}, "Canindeyu":{}, "Central":{}, "Concepcion":{}, "Cordillera":{}, "Guaira":{}, "Itapua":{}, "Misiones":{}, "Neembucu":{}, "Paraguari":{}, "Presidente Hayes":{}, "San Pedro":{},
         },
         
         "Peru":{
           "Amazonas":{}, "Ancash":{}, "Apurimac":{}, "Arequipa":{}, "Ayacucho":{}, "Cajamarca":{}, "Callao":{}, "Cusco":{}, "Huancavelica":{}, "Huanuco":{}, "Ica":{}, "Junin":{}, "La Libertad":{}, "Lambayeque":{}, "Lima":{}, "Loreto":{}, "Madre de Dios":{}, "Moquegua":{}, "Pasco":{}, "Piura":{}, "Puno":{}, "San Martin":{}, "Tacna":{}, "Tumbes":{}, "Ucayali":{},
         },
         "Philippines":{
           "Abra":{}, "Agusan del Norte":{}, "Agusan del Sur":{}, "Aklan":{}, "Albay":{}, "Antique":{}, "Apayao":{}, "Aurora":{}, "Basilan":{}, "Bataan":{}, "Batanes":{}, "Batangas":{}, "Biliran":{}, "Benguet":{}, "Bohol":{}, "Bukidnon":{}, "Bulacan":{}, "Cagayan":{}, "Camarines Norte":{}, "Camarines Sur":{}, "Camiguin":{}, "Capiz":{}, "Catanduanes":{}, "Cavite":{}, "Cebu":{}, "Compostela":{}, "Davao del Norte":{}, "Davao del Sur":{}, "Davao Oriental":{}, "Eastern Samar":{}, "Guimaras":{}, "Ifugao":{}, "Ilocos Norte":{}, "Ilocos Sur":{}, "Iloilo":{}, "Isabela":{}, "Kalinga":{}, "Laguna":{}, "Lanao del Norte":{}, "Lanao del Sur":{}, "La Union":{}, "Leyte":{}, "Maguindanao":{}, "Marinduque":{}, "Masbate":{}, "Mindoro Occidental":{}, "Mindoro Oriental":{}, "Misamis Occidental":{}, "Misamis Oriental":{}, "Mountain Province":{}, "Negros Occidental":{}, "Negros Oriental":{}, "North Cotabato":{}, "Northern Samar":{}, "Nueva Ecija":{}, "Nueva Vizcaya":{}, "Palawan":{}, "Pampanga":{}, "Pangasinan":{}, "Quezon":{}, "Quirino":{}, "Rizal":{}, "Romblon":{}, "Samar":{}, "Sarangani":{}, "Siquijor":{}, "Sorsogon":{}, "South Cotabato":{}, "Southern Leyte":{}, "Sultan Kudarat":{}, "Sulu":{}, "Surigao del Norte":{}, "Surigao del Sur":{}, "Tarlac":{}, "Tawi-Tawi":{}, "Zambales":{}, "Zamboanga del Norte":{}, "Zamboanga del Sur":{}, "Zamboanga Sibugay":{},
         },
         
         "Poland":{
           "Greater Poland (Wielkopolskie)":{}, "Kuyavian-Pomeranian (Kujawsko-Pomorskie)":{}, "Lesser Poland (Malopolskie)":{}, "Lodz (Lodzkie)":{}, "Lower Silesian (Dolnoslaskie)":{}, "Lublin (Lubelskie)":{}, "Lubusz (Lubuskie)":{}, "Masovian (Mazowieckie)":{}, "Opole (Opolskie)":{}, "Podlasie (Podlaskie)":{}, "Pomeranian (Pomorskie)":{}, "Silesian (Slaskie)":{}, "Subcarpathian (Podkarpackie)":{}, "Swietokrzyskie (Swietokrzyskie)":{}, "Warmian-Masurian (Warminsko-Mazurskie)":{}, "West Pomeranian (Zachodniopomorskie)":{},
         },
        
         "Portugal":{
           "Aveiro":{}, "Acores":{}, "Beja":{}, "Braga":{}, "Braganca":{}, "Castelo Branco":{}, "Coimbra":{}, "Evora":{}, "Faro":{}, "Guarda":{}, "Leiria":{}, "Lisboa":{}, "Madeira":{}, "Portalegre":{}, "Porto":{}, "Santarem":{}, "Setubal":{}, "Viana do Castelo":{}, "Vila Real":{}, "Viseu":{},
         },
         
         "Qatar":{
           "Ad Dawhah":{}, "Al Ghuwayriyah":{}, "Al Jumayliyah":{}, "Al Khawr":{}, "Al Wakrah":{}, "Ar Rayyan":{}, "Jarayan al Batinah":{}, "Madinat ash Shamal":{}, "Umm Sa'id":{}, "Umm Salal":{},
         },
         
         "Romania":{
           "Alba":{}, "Arad":{}, "Arges":{}, "Bacau":{}, "Bihor":{}, "Bistrita-Nasaud":{}, "Botosani":{}, "Braila":{}, "Brasov":{}, "Bucuresti":{}, "Buzau":{}, "Calarasi":{}, "Caras-Severin":{}, "Cluj":{}, "Constanta":{}, "Covasna":{}, "Dimbovita":{}, "Dolj":{}, "Galati":{}, "Gorj":{}, "Giurgiu":{}, "Harghita":{}, "Hunedoara":{}, "Ialomita":{}, "Iasi":{}, "Ilfov":{}, "Maramures":{}, "Mehedinti":{}, "Mures":{}, "Neamt":{}, "Olt":{}, "Prahova":{}, "Salaj":{}, "Satu Mare":{}, "Sibiu":{}, "Suceava":{}, "Teleorman":{}, "Timis":{}, "Tulcea":{}, "Vaslui":{}, "Vilcea":{}, "Vrancea":{},
         },
         "Russia":{
           "Amur":{}, "Arkhangel'sk":{}, "Astrakhan'":{}, "Belgorod":{}, "Bryansk":{}, "Chelyabinsk":{}, "Chita":{}, "Irkutsk":{}, "Ivanovo":{}, "Kaliningrad":{}, "Kaluga":{}, "Kamchatka":{}, "Kemerovo":{}, "Kirov":{}, "Kostroma":{}, "Kurgan":{}, "Kursk":{}, "Leningrad":{}, "Lipetsk":{}, "Magadan":{}, "Moscow":{}, "Murmansk":{}, "Nizhniy Novgorod":{}, "Novgorod":{}, "Novosibirsk":{}, "Omsk":{}, "Orenburg":{}, "Orel":{}, "Penza":{}, "Perm'":{}, "Pskov":{}, "Rostov":{}, "Ryazan'":{}, "Sakhalin":{}, "Samara":{}, "Saratov":{}, "Smolensk":{}, "Sverdlovsk":{}, "Tambov":{}, "Tomsk":{}, "Tula":{}, "Tver'":{}, "Tyumen'":{}, "Ul'yanovsk":{}, "Vladimir":{}, "Volgograd":{}, "Vologda":{}, "Voronezh":{}, "Yaroslavl'":{}, "Adygeya":{}, "Altay":{}, "Bashkortostan":{}, "Buryatiya":{}, "Chechnya":{}, "Chuvashiya":{}, "Dagestan":{}, "Ingushetiya":{}, "Kabardino-Balkariya":{}, "Kalmykiya":{}, "Karachayevo-Cherkesiya":{}, "Kareliya":{}, "Khakasiya":{}, "Komi":{}, "Mariy-El":{}, "Mordoviya":{}, "Sakha":{}, "North Ossetia":{}, "Tatarstan":{}, "Tyva":{}, "Udmurtiya":{}, "Aga Buryat":{}, "Chukotka":{}, "Evenk":{}, "Khanty-Mansi":{}, "Komi-Permyak":{}, "Koryak":{}, "Nenets":{}, "Taymyr":{}, "Ust'-Orda Buryat":{}, "Yamalo-Nenets":{}, "Altay":{}, "Khabarovsk":{}, "Krasnodar":{}, "Krasnoyarsk":{}, "Primorskiy":{}, "Stavropol'":{}, "Moscow":{}, "St. Petersburg":{}, "Yevrey":{},
         },
         
         "Rwanda":{
           "Butare":{}, "Byumba":{}, "Cyangugu":{}, "Gikongoro":{}, "Gisenyi":{}, "Gitarama":{}, "Kibungo":{}, "Kibuye":{}, "Kigali Rurale":{}, "Kigali-ville":{}, "Umutara":{}, "Ruhengeri":{},
         },
         "Samoa":{
           "A'ana":{}, "Aiga-i-le-Tai":{}, "Atua":{}, "Fa'asaleleaga":{}, "Gaga'emauga":{}, "Gagaifomauga":{}, "Palauli":{}, "Satupa'itea":{}, "Tuamasaga":{}, "Va'a-o-Fonoti":{}, "Vaisigano":{},
         },
         "San Marino":{
           "Acquaviva":{}, "Borgo Maggiore":{}, "Chiesanuova":{}, "Domagnano":{}, "Faetano":{}, "Fiorentino":{}, "Montegiardino":{}, "San Marino Citta":{}, "Serravalle":{},
         },
         "Sao Tome":{
          "Sao Tome":{},
         },
       
         "Saudi Arabia":{
           "Al Bahah":{}, "Al Hudud ash Shamaliyah":{}, "Al Jawf":{}, "Al Madinah":{}, "Al Qasim":{}, "Ar Riyad":{}, "Ash Sharqiyah":{}, "'Asir":{}, "Ha'il":{}, "Jizan":{}, "Makkah":{}, "Najran":{}, "Tabuk":{},
         },
         
         "Senegal":{
           "Dakar":{}, "Diourbel":{}, "Fatick":{}, "Kaolack":{}, "Kolda":{}, "Louga":{}, "Matam":{}, "Saint-Louis":{}, "Tambacounda":{}, "Thies":{}, "Ziguinchor":{},
         },
         
         "Serbia and Montenegro":{
           "Kosovo":{}, "Montenegro":{}, "Serbia":{}, "Vojvodina":{},
         },
         
         "Seychelles":{
           "Anse aux Pins":{}, "Anse Boileau":{}, "Anse Etoile":{}, "Anse Louis":{}, "Anse Royale":{}, "Baie Lazare":{}, "Baie Sainte Anne":{}, "Beau Vallon":{}, "Bel Air":{}, "Bel Ombre":{}, "Cascade":{}, "Glacis":{}, "Grand' Anse":{}, "Grand' Anse":{}, "La Digue":{}, "La Riviere Anglaise":{}, "Mont Buxton":{}, "Mont Fleuri":{}, "Plaisance":{}, "Pointe La Rue":{}, "Port Glaud":{}, "Saint Louis":{}, "Takamaka":{},
         },
         
         "Sierra Leone":{
          "Sierra Leone":{},
         },
        
         "Singapore":{
          "central Water Catchment":{},"Lim Chu Kang":{},"Mandai":{}, "Mandai East":{}, "Mandai Estate":{}, "Mandai West":{},"Sembawang:":{},"Admiralty":{}, "Sembawang Central":{}, "Sembawang East":{},"Simpang":{}, "Pulau Seletar":{}, "Simpang North":{},"Sungei Kadut":{}, "Gali Batu":{}, "Kranji":{},"Woodlands":{}, "Greenwood Park":{}, "Midview":{},"Singapore":{},
         },
         "Slovakia":{
           "Banskobystricky":{}, "Bratislavsky":{}, "Kosicky":{}, "Nitriansky":{}, "Presovsky":{}, "Trenciansky":{}, "Trnavsky":{}, "Zilinsky":{},
         },
        
      
         "Slovenia":{
   "Ajdovscina":{}, "Beltinci":{}, "Benedikt":{}, "Bistrica ob Sotli":{}, "Bled":{}, "Bloke":{}, "Bohinj":{}, "Borovnica":{}, "Bovec":{}, "Braslovce":{}, "Brda":{}, "Brezice":{}, "Brezovica":{}, "Cankova":{}, "Celje":{}, "Cerklje na Gorenjskem":{}, "Cerknica":{}, "Cerkno":{}, "Cerkvenjak":{}, "Crensovci":{}, "Crna na Koroskem":{}, "Crnomelj":{}, "Destrnik":{}, "Divaca":{}, "Dobje":{}, "Dobrepolje":{}, "Dobrna":{}, "Dobrova-Horjul-Polhov Gradec":{}, "Dobrovnik-Dobronak":{}, "Dolenjske Toplice":{}, "Dol pri Ljubljani":{}, "Domzale":{}, "Dornava":{}, "Dravograd":{}, "Duplek":{}, "Gorenja Vas-Poljane":{}, "Gorisnica":{}, "Gornja Radgona":{}, "Gornji Grad":{}, "Gornji Petrovci":{}, "Grad":{}, "Grosuplje":{}, "Hajdina":{}, "Hoce-Slivnica":{}, "Hodos-Hodos":{}, "Horjul":{}, "Hrastnik":{}, "Hrpelje-Kozina":{}, "Idrija":{}, "Ig":{}, "Ilirska Bistrica":{}, "Ivancna Gorica":{}, "Izola-Isola":{}, "Jesenice":{}, "Jezersko":{}, "Jursinci":{}, "Kamnik":{}, "Kanal":{}, "Kidricevo":{}, "Kobarid":{}, "Kobilje":{}, "Kocevje":{}, "Komen":{}, "Komenda":{}, "Koper-Capodistria":{}, "Kostel":{}, "Kozje":{}, "Kranj":{}, "Kranjska Gora":{}, "Krizevci":{}, "Krsko":{}, "Kungota":{}, "Kuzma":{}, "Lasko":{}, "Lenart":{}, "Lendava-Lendva":{}, "Litija":{}, "Ljubljana":{}, "Ljubno":{}, "Ljutomer":{}, "Logatec":{}, "Loska Dolina":{}, "Loski Potok":{}, "Lovrenc na Pohorju":{}, "Luce":{}, "Lukovica":{}, "Majsperk":{}, "Maribor":{}, "Markovci":{}, "Medvode":{}, "Menges":{}, "Metlika":{}, "Mezica":{}, "Miklavz na Dravskem Polju":{}, "Miren-Kostanjevica":{}, "Mirna Pec":{}, "Mislinja":{}, "Moravce":{}, "Moravske Toplice":{}, "Mozirje":{}, "Murska Sobota":{}, "Muta":{}, "Naklo":{}, "Nazarje":{}, "Nova Gorica":{}, "Novo Mesto":{}, "Odranci":{}, "Oplotnica":{}, "Ormoz":{}, "Osilnica":{}, "Pesnica":{}, "Piran-Pirano":{}, "Pivka":{}, "Podcetrtek":{}, "Podlehnik":{}, "Podvelka":{}, "Polzela":{}, "Postojna":{}, "Prebold":{}, "Preddvor":{}, "Prevalje":{}, "Ptuj":{}, "Puconci":{}, "Race-Fram":{}, "Radece":{}, "Radenci":{}, "Radlje ob Dravi":{}, "Radovljica":{}, "Ravne na Koroskem":{}, "Razkrizje":{}, "Ribnica":{}, "Ribnica na Pohorju":{}, "Rogasovci":{}, "Rogaska Slatina":{}, "Rogatec":{}, "Ruse":{}, "Salovci":{}, "Selnica ob Dravi":{}, "Semic":{}, "Sempeter-Vrtojba":{}, "Sencur":{}, "Sentilj":{}, "Sentjernej":{}, "Sentjur pri Celju":{}, "Sevnica":{}, "Sezana":{}, "Skocjan":{}, "Skofja Loka":{}, "Skofljica":{}, "Slovenj Gradec":{}, "Slovenska Bistrica":{}, "Slovenske Konjice":{}, "Smarje pri Jelsah":{}, "Smartno ob Paki":{}, "Smartno pri Litiji":{}, "Sodrazica":{}, "Solcava":{}, "Sostanj":{}, "Starse":{}, "Store":{}, "Sveta Ana":{}, "Sveti Andraz v Slovenskih Goricah":{}, "Sveti Jurij":{}, "Tabor":{}, "Tisina":{}, "Tolmin":{}, "Trbovlje":{}, "Trebnje":{}, "Trnovska Vas":{}, "Trzic":{}, "Trzin":{}, "Turnisce":{}, "Velenje":{}, "Velika Polana":{}, "Velike Lasce":{}, "Verzej":{}, "Videm":{}, "Vipava":{}, "Vitanje":{}, "Vodice":{}, "Vojnik":{}, "Vransko":{}, "Vrhnika":{}, "Vuzenica":{}, "Zagorje ob Savi":{}, "Zalec":{}, "Zavrc":{}, "Zelezniki":{}, "Zetale":{}, "Ziri":{}, "Zirovnica":{}, "Zuzemberk":{}, "Zrece":{},
      },
        
         "Solomon Islands":{
           "Central":{}, "Choiseul":{}, "Guadalcanal":{}, "Honiara":{}, "Isabel":{}, "Makira":{}, "Malaita":{}, "Rennell and Bellona":{}, "Temotu":{}, "Western":{},
         },
         
         "Somalia":{
           "Awdal":{}, "Bakool":{}, "Banaadir":{}, "Bari":{}, "Bay":{}, "Galguduud":{}, "Gedo":{}, "Hiiraan":{}, "Jubbada Dhexe":{}, "Jubbada Hoose":{}, "Mudug":{}, "Nugaal":{}, "Sanaag":{}, "Shabeellaha Dhexe":{}, "Shabeellaha Hoose":{}, "Sool":{}, "Togdheer":{}, "Woqooyi Galbeed":{},
         },
         
         "South Africa":{
           "Eastern Cape":{}, "Free State":{}, "Gauteng":{}, "KwaZulu-Natal":{}, "Limpopo":{}, "Mpumalanga":{}, "North-West":{}, "Northern Cape":{}, "Western Cape":{},
         },
         
         "Spain":{
           "Andalucia":{}, "Aragon":{}, "Asturias":{}, "Baleares":{}, "Ceuta":{}, "Canarias":{}, "Cantabria":{}, "Castilla-La Mancha":{}, "Castilla y Leon":{}, "Cataluna":{}, "Comunidad Valenciana":{}, "Extremadura":{}, "Galicia":{}, "La Rioja":{}, "Madrid":{}, "Melilla":{}, "Murcia":{}, "Navarra":{}, "Pais Vasco":{},
         },
         
         "Sri Lanka":{
           "Central":{}, "North Central":{}, "North Eastern":{}, "North Western":{}, "Sabaragamuwa":{}, "Southern":{}, "Uva":{}, "Western":{},
         },
         
         "Sudan":{
           "A'ali an Nil":{}, "Al Bahr al Ahmar":{}, "Al Buhayrat":{}, "Al Jazirah":{}, "Al Khartum":{}, "Al Qadarif":{}, "Al Wahdah":{}, "An Nil al Abyad":{}, "An Nil al Azraq":{}, "Ash Shamaliyah":{}, "Bahr al Jabal":{}, "Gharb al Istiwa'iyah":{}, "Gharb Bahr al Ghazal":{}, "Gharb Darfur":{}, "Gharb Kurdufan":{}, "Janub Darfur":{}, "Janub Kurdufan":{}, "Junqali":{}, "Kassala":{}, "Nahr an Nil":{}, "Shamal Bahr al Ghazal":{}, "Shamal Darfur":{}, "Shamal Kurdufan":{}, "Sharq al Istiwa'iyah":{}, "Sinnar":{}, "Warab":{},
         },
         
         "Suriname":{
           "Brokopondo":{}, "Commewijne":{}, "Coronie":{}, "Marowijne":{}, "Nickerie":{}, "Para":{}, "Paramaribo":{}, "Saramacca":{}, "Sipaliwini":{}, "Wanica":{},
         },
         
         "Swaziland":{
           "Hhohho":{}, "Lubombo":{}, "Manzini":{}, "Shiselweni":{},
         },
         
         "Sweden":{
           "Blekinge":{}, "Dalarnas":{}, "Gavleborgs":{}, "Gotlands":{}, "Hallands":{}, "Jamtlands":{}, "Jonkopings":{}, "Kalmar":{}, "Kronobergs":{}, "Norrbottens":{}, "Orebro":{}, "Ostergotlands":{}, "Skane":{}, "Sodermanlands":{}, "Stockholms":{}, "Uppsala":{}, "Varmlands":{}, "Vasterbottens":{}, "Vasternorrlands":{}, "Vastmanlands":{}, "Vastra Gotalands":{},
         },
         
         "Switzerland":{
           "Aargau":{}, "Appenzell Ausser-Rhoden":{}, "Appenzell Inner-Rhoden":{}, "Basel-Landschaft":{}, "Basel-Stadt":{}, "Bern":{}, "Fribourg":{}, "Geneve":{}, "Glarus":{}, "Graubunden":{}, "Jura":{}, "Luzern":{}, "Neuchatel":{}, "Nidwalden":{}, "Obwalden":{}, "Sankt Gallen":{}, "Schaffhausen":{}, "Schwyz":{}, "Solothurn":{}, "Thurgau":{}, "Ticino":{}, "Uri":{}, "Valais":{}, "Vaud":{}, "Zug":{}, "Zurich":{},
         },
        
         "Syria":{
           "Al Hasakah":{}, "Al Ladhiqiyah":{}, "Al Qunaytirah":{}, "Ar Raqqah":{}, "As Suwayda'":{}, "Dar'a":{}, "Dayr az Zawr":{}, "Dimashq":{}, "Halab":{}, "Hamah":{}, "Hims":{}, "Idlib":{}, "Rif Dimashq":{}, "Tartus":{},
         },
         "Taiwan":{
           "Chang-hua":{}, "Chia-i":{}, "Hsin-chu":{}, "Hua-lien":{}, "I-lan":{}, "Kao-hsiung":{}, "Kin-men":{}, "Lien-chiang":{}, "Miao-li":{}, "Nan-t'ou":{}, "P'eng-hu":{}, "P'ing-tung":{}, "T'ai-chung":{}, "T'ai-nan":{}, "T'ai-pei":{}, "T'ai-tung":{}, "T'ao-yuan":{}, "Yun-lin":{}, "Chia-i":{}, "Chi-lung":{}, "Hsin-chu":{}, "T'ai-chung":{}, "T'ai-nan":{}, "Kao-hsiung city":{}, "T'ai-pei city":{},
         },
        
         "Tajikistan":{
          "Tajikistan":{},
         },
        
         "Tanzania":{
           "Arusha":{}, "Dar es Salaam":{}, "Dodoma":{}, "Iringa":{}, "Kagera":{}, "Kigoma":{}, "Kilimanjaro":{}, "Lindi":{}, "Manyara":{}, "Mara":{}, "Mbeya":{}, "Morogoro":{}, "Mtwara":{}, "Mwanza":{}, "Pemba North":{}, "Pemba South":{}, "Pwani":{}, "Rukwa":{}, "Ruvuma":{}, "Shinyanga":{}, "Singida":{}, "Tabora":{}, "Tanga":{}, "Zanzibar Central/South":{}, "Zanzibar North":{}, "Zanzibar Urban/West":{},
         },
         
         "Thailand":{
           "Amnat Charoen":{}, "Ang Thong":{}, "Buriram":{}, "Chachoengsao":{}, "Chai Nat":{}, "Chaiyaphum":{}, "Chanthaburi":{}, "Chiang Mai":{}, "Chiang Rai":{}, "Chon Buri":{}, "Chumphon":{}, "Kalasin":{}, "Kamphaeng Phet":{}, "Kanchanaburi":{}, "Khon Kaen":{}, "Krabi":{}, "Krung Thep Mahanakhon":{}, "Lampang":{}, "Lamphun":{}, "Loei":{}, "Lop Buri":{}, "Mae Hong Son":{}, "Maha Sarakham":{}, "Mukdahan":{}, "Nakhon Nayok":{}, "Nakhon Pathom":{}, "Nakhon Phanom":{}, "Nakhon Ratchasima":{}, "Nakhon Sawan":{}, "Nakhon Si Thammarat":{}, "Nan":{}, "Narathiwat":{}, "Nong Bua Lamphu":{}, "Nong Khai":{}, "Nonthaburi":{}, "Pathum Thani":{}, "Pattani":{}, "Phangnga":{}, "Phatthalung":{}, "Phayao":{}, "Phetchabun":{}, "Phetchaburi":{}, "Phichit":{}, "Phitsanulok":{}, "Phra Nakhon Si Ayutthaya":{}, "Phrae":{}, "Phuket":{}, "Prachin Buri":{}, "Prachuap Khiri Khan":{}, "Ranong":{}, "Ratchaburi":{}, "Rayong":{}, "Roi Et":{}, "Sa Kaeo":{}, "Sakon Nakhon":{}, "Samut Prakan":{}, "Samut Sakhon":{}, "Samut Songkhram":{}, "Sara Buri":{}, "Satun":{}, "Sing Buri":{}, "Sisaket":{}, "Songkhla":{}, "Sukhothai":{}, "Suphan Buri":{}, "Surat Thani":{}, "Surin":{}, "Tak":{}, "Trang":{}, "Trat":{}, "Ubon Ratchathani":{}, "Udon Thani":{}, "Uthai Thani":{}, "Uttaradit":{}, "Yala":{}, "Yasothon":{},
         },
         
         "Togo":{
           "Kara":{}, "Plateaux":{}, "Savanes":{}, "Centrale":{}, "Maritime":{},
         },
         
         "Tonga":{
   "Tonga":{},
         },
        
         "Trinidad and Tobago":{
           "Couva":{}, "Diego Martin":{}, "Mayaro":{}, "Penal":{}, "Princes Town":{}, "Sangre Grande":{}, "San Juan":{}, "Siparia":{}, "Tunapuna":{}, "Port-of-Spain":{}, "San Fernando":{}, "Arima":{}, "Point Fortin":{}, "Chaguanas":{}, "Tobago":{},
         },
        
         "Tunisia":{
           "Ariana (Aryanah)":{}, "Beja (Bajah)":{}, "Ben Arous (Bin 'Arus)":{}, "Bizerte (Banzart)":{}, "Gabes (Qabis)":{}, "Gafsa (Qafsah)":{}, "Jendouba (Jundubah)":{}, "Kairouan (Al Qayrawan)":{}, "Kasserine (Al Qasrayn)":{}, "Kebili (Qibili)":{}, "Kef (Al Kaf)":{}, "Mahdia (Al Mahdiyah)":{}, "Manouba (Manubah)":{}, "Medenine (Madanin)":{}, "Monastir (Al Munastir)":{}, "Nabeul (Nabul)":{}, "Sfax (Safaqis)":{}, "Sidi Bou Zid (Sidi Bu Zayd)":{}, "Siliana (Silyanah)":{}, "Sousse (Susah)":{}, "Tataouine (Tatawin)":{}, "Tozeur (Tawzar)":{}, "Tunis":{}, "Zaghouan (Zaghwan)":{},
         },
         
         "Turkey":{
           "Adana":{}, "Adiyaman":{}, "Afyonkarahisar":{}, "Agri":{}, "Aksaray":{}, "Amasya":{}, "Ankara":{}, "Antalya":{}, "Ardahan":{}, "Artvin":{}, "Aydin":{}, "Balikesir":{}, "Bartin":{}, "Batman":{}, "Bayburt":{}, "Bilecik":{}, "Bingol":{}, "Bitlis":{}, "Bolu":{}, "Burdur":{}, "Bursa":{}, "Canakkale":{}, "Cankiri":{}, "Corum":{}, "Denizli":{}, "Diyarbakir":{}, "Duzce":{}, "Edirne":{}, "Elazig":{}, "Erzincan":{}, "Erzurum":{}, "Eskisehir":{}, "Gaziantep":{}, "Giresun":{}, "Gumushane":{}, "Hakkari":{}, "Hatay":{}, "Igdir":{}, "Isparta":{}, "Istanbul":{}, "Izmir":{}, "Kahramanmaras":{}, "Karabuk":{}, "Karaman":{}, "Kars":{}, "Kastamonu":{}, "Kayseri":{}, "Kilis":{}, "Kirikkale":{}, "Kirklareli":{}, "Kirsehir":{}, "Kocaeli":{}, "Konya":{}, "Kutahya":{}, "Malatya":{}, "Manisa":{}, "Mardin":{}, "Mersin":{}, "Mugla":{}, "Mus":{}, "Nevsehir":{}, "Nigde":{}, "Ordu":{}, "Osmaniye":{}, "Rize":{}, "Sakarya":{}, "Samsun":{}, "Sanliurfa":{}, "Siirt":{}, "Sinop":{}, "Sirnak":{}, "Sivas":{}, "Tekirdag":{}, "Tokat":{}, "Trabzon":{}, "Tunceli":{}, "Usak":{}, "Van":{}, "Yalova":{}, "Yozgat":{}, "Zonguldak":{},
         },
       
         "Turkmenistan":{
           "Ahal Welayaty (Ashgabat)":{}, "Balkan Welayaty (Balkanabat)":{}, "Dashoguz Welayaty":{}, "Lebap Welayaty (Turkmenabat)":{}, "Mary Welayaty":{},
         },
        "Turks and Caicos Islands":{
          "Turks and Caicos Islands":{},
    },
    "Tuvalu":{
      "Tuvalu":{},
      },
      "TogoToke":{
        "TogoToke":{},
      },
      "Timor-Leste":{
        "Timor-Leste":{},
      },
      
 
         "Uganda":{
           "Adjumani":{}, "Apac":{}, "Arua":{}, "Bugiri":{}, "Bundibugyo":{}, "Bushenyi":{}, "Busia":{}, "Gulu":{}, "Hoima":{}, "Iganga":{}, "Jinja":{}, "Kabale":{}, "Kabarole":{}, "Kaberamaido":{}, "Kalangala":{}, "Kampala":{}, "Kamuli":{}, "Kamwenge":{}, "Kanungu":{}, "Kapchorwa":{}, "Kasese":{}, "Katakwi":{}, "Kayunga":{}, "Kibale":{}, "Kiboga":{}, "Kisoro":{}, "Kitgum":{}, "Kotido":{}, "Kumi":{}, "Kyenjojo":{}, "Lira":{}, "Luwero":{}, "Masaka":{}, "Masindi":{}, "Mayuge":{}, "Mbale":{}, "Mbarara":{}, "Moroto":{}, "Moyo":{}, "Mpigi":{}, "Mubende":{}, "Mukono":{}, "Nakapiripirit":{}, "Nakasongola":{}, "Nebbi":{}, "Ntungamo":{}, "Pader":{}, "Pallisa":{}, "Rakai":{}, "Rukungiri":{}, "Sembabule":{}, "Sironko":{}, "Soroti":{}, "Tororo":{}, "Wakiso":{}, "Yumbe":{},
         },
         "Ukraine":{
           "Cherkasy":{}, "Chernihiv":{}, "Chernivtsi":{}, "Crimea":{}, "Dnipropetrovs'k":{}, "Donets'k":{}, "Ivano-Frankivs'k":{}, "Kharkiv":{}, "Kherson":{}, "Khmel'nyts'kyy":{}, "Kirovohrad":{}, "Kiev":{}, "Kyyiv":{}, "Luhans'k":{}, "L'viv":{}, "Mykolayiv":{}, "Odesa":{}, "Poltava":{}, "Rivne":{}, "Sevastopol'":{}, "Sumy":{}, "Ternopil'":{}, "Vinnytsya":{}, "Volyn'":{}, "Zakarpattya":{}, "Zaporizhzhya":{}, "Zhytomyr":{},
         },
         
         "United Arab Emirates":{
           "Abu Dhabi":{}, "'Ajman":{}, "Al Fujayrah":{}, "Sharjah":{}, "Dubai":{}, "Ra's al Khaymah":{}, "Umm al Qaywayn":{},
         },
         
         "United Kingdom":{ "Aberconwy and Colwyn":{}, "Aberdeen City":{}, "Aberdeenshire":{}, "Anglesey":{}, "Angus":{}, "Antrim":{}, "Argyll and Bute":{}, "Armagh":{}, "Avon":{}, "Ayrshire":{}, "Bath and NE Somerset":{}, "Bedfordshire":{}, "Belfast":{}, "Berkshire":{}, "Berwickshire":{}, "BFPO":{}, "Blaenau Gwent":{}, "Buckinghamshire":{}, "Caernarfonshire":{}, "Caerphilly":{}, "Caithness":{}, "Cambridgeshire":{}, "Cardiff":{}, "Cardiganshire":{}, "Carmarthenshire":{}, "Ceredigion":{}, "Channel Islands":{}, "Cheshire":{}, "City of Bristol":{}, "Clackmannanshire":{}, "Clwyd":{}, "Conwy":{}, "Cornwall/Scilly":{}, "Cumbria":{}, "Denbighshire":{}, "Derbyshire":{}, "Derry/Londonderry":{}, "Devon":{}, "Dorset":{}, "Down":{}, "Dumfries and Galloway":{}, "Dunbartonshire":{}, "Dundee":{}, "Durham":{}, "Dyfed":{}, "East Ayrshire":{}, "East Dunbartonshire":{}, "East Lothian":{}, "East Renfrewshire":{}, "East Riding Yorkshire":{}, "East Sussex":{}, "Edinburgh":{}, "England":{}, "Essex":{}, "Falkirk":{}, "Fermanagh":{}, "Fife":{}, "Flintshire":{}, "Glasgow":{}, "Gloucestershire":{}, "Greater London":{}, "Greater Manchester":{}, "Gwent":{}, "Gwynedd":{}, "Hampshire":{}, "Hartlepool":{}, "Hereford and Worcester":{}, "Hertfordshire":{}, "Highlands":{}, "Inverclyde":{}, "Inverness-Shire":{}, "Isle of Man":{}, "Isle of Wight":{}, "Kent":{}, "Kincardinshire":{}, "Kingston Upon Hull":{}, "Kinross-Shire":{}, "Kirklees":{}, "Lanarkshire":{}, "Lancashire":{}, "Leicestershire":{}, "Lincolnshire":{}, "Londonderry":{}, "Merseyside":{}, "Merthyr Tydfil":{}, "Mid Glamorgan":{}, "Mid Lothian":{}, "Middlesex":{}, "Monmouthshire":{}, "Moray":{}, "Neath & Port Talbot":{}, "Newport":{}, "Norfolk":{}, "North Ayrshire":{}, "North East Lincolnshire":{}, "North Lanarkshire":{}, "North Lincolnshire":{}, "North Somerset":{}, "North Yorkshire":{}, "Northamptonshire":{}, "Northern Ireland":{}, "Northumberland":{}, "Nottinghamshire":{}, "Orkney and Shetland Isles":{}, "Oxfordshire":{}, "Pembrokeshire":{}, "Perth and Kinross":{}, "Powys":{}, "Redcar and Cleveland":{}, "Renfrewshire":{}, "Rhonda Cynon Taff":{}, "Rutland":{}, "Scottish Borders":{}, "Shetland":{}, "Shropshire":{}, "Somerset":{}, "South Ayrshire":{}, "South Glamorgan":{}, "South Gloucesteshire":{}, "South Lanarkshire":{}, "South Yorkshire":{}, "Staffordshire":{}, "Stirling":{}, "Stockton On Tees":{}, "Suffolk":{}, "Surrey":{}, "Swansea":{}, "Torfaen":{}, "Tyne and Wear":{}, "Tyrone":{}, "Vale Of Glamorgan":{}, "Wales":{}, "Warwickshire":{}, "West Berkshire":{}, "West Dunbartonshire":{}, "West Glamorgan":{}, "West Lothian":{}, "West Midlands":{}, "West Sussex":{}, "West Yorkshire":{}, "Western Isles":{}, "Wiltshire":{}, "Wirral":{}, "Worcestershire":{}, "Wrexham":{}, "York":{}, 
   
         },
         "United States of America":{
           "Alabama":{}, "Alaska":{}, "Arizona":{}, "Arkansas":{}, "California":{}, "Colorado":{}, "Connecticut":{}, "Delaware":{}, "District of Columbia":{}, "Florida":{}, "Georgia":{}, "Hawaii":{}, "Idaho":{}, "Illinois":{}, "Indiana":{}, "Iowa":{}, "Kansas":{}, "Kentucky":{}, "Louisiana":{}, "Maine":{}, "Maryland":{}, "Massachusetts":{}, "Michigan":{}, "Minnesota":{}, "Mississippi":{}, "Missouri":{}, "Montana":{}, "Nebraska":{}, "Nevada":{}, "New Hampshire":{}, "New Jersey":{}, "New Mexico":{}, "New York":{}, "North Carolina":{}, "North Dakota":{}, "Ohio":{}, "Oklahoma":{}, "Oregon":{}, "Pennsylvania":{}, "Rhode Island":{}, "South Carolina":{}, "South Dakota":{}, "Tennessee":{}, "Texas":{}, "Utah":{}, "Vermont":{}, "Virginia":{}, "Washington":{}, "West Virginia":{}, "Wisconsin":{}, "Wyoming":{},
         },
         
         "Uruguay":{
           "Artigas":{}, "Canelones":{}, "Cerro Largo":{}, "Colonia":{}, "Durazno":{}, "Flores":{}, "Florida":{}, "Lavalleja":{}, "Maldonado":{}, "Montevideo":{}, "Paysandu":{}, "Rio Negro":{}, "Rivera":{}, "Rocha":{}, "Salto":{}, "San Jose":{}, "Soriano":{}, "Tacuarembo":{}, "Treinta y Tres":{},
         },
         
         "Uzbekistan":{
           "Andijon Viloyati":{}, "Buxoro Viloyati":{}, "Farg'ona Viloyati":{}, "Jizzax Viloyati":{}, "Namangan Viloyati":{}, "Navoiy Viloyati":{}, "Qashqadaryo Viloyati":{}, "Qaraqalpog'iston Respublikasi":{}, "Samarqand Viloyati":{}, "Sirdaryo Viloyati":{}, "Surxondaryo Viloyati":{}, "Toshkent Shahri":{}, "Toshkent Viloyati":{}, "Xorazm Viloyati":{},
         },
         
         "Vanuatu":{
           "Malampa":{}, "Penama":{}, "Sanma":{}, "Shefa":{}, "Tafea":{}, "Torba":{},
         },
         
         "Venezuela":{
           "Amazonas":{}, "Anzoategui":{}, "Apure":{}, "Aragua":{}, "Barinas":{}, "Bolivar":{}, "Carabobo":{}, "Cojedes":{}, "Delta Amacuro":{}, "Dependencias Federales":{}, "Distrito Federal":{}, "Falcon":{}, "Guarico":{}, "Lara":{}, "Merida":{}, "Miranda":{}, "Monagas":{}, "Nueva Esparta":{}, "Portuguesa":{}, "Sucre":{}, "Tachira":{}, "Trujillo":{}, "Vargas":{}, "Yaracuy":{}, "Zulia":{},
         },
         
         "Vietnam":{
           "An Giang":{}, "Bac Giang":{}, "Bac Kan":{}, "Bac Lieu":{}, "Bac Ninh":{}, "Ba Ria-Vung Tau":{}, "Ben Tre":{}, "Binh Dinh":{}, "Binh Duong":{}, "Binh Phuoc":{}, "Binh Thuan":{}, "Ca Mau":{}, "Cao Bang":{}, "Dac Lak":{}, "Dac Nong":{}, "Dien Bien":{}, "Dong Nai":{}, "Dong Thap":{}, "Gia Lai":{}, "Ha Giang":{}, "Hai Duong":{}, "Ha Nam":{}, "Ha Tay":{}, "Ha Tinh":{}, "Hau Giang":{}, "Hoa Binh":{}, "Hung Yen":{}, "Khanh Hoa":{}, "Kien Giang":{}, "Kon Tum":{}, "Lai Chau":{}, "Lam Dong":{}, "Lang Son":{}, "Lao Cai":{}, "Long An":{}, "Nam Dinh":{}, "Nghe An":{}, "Ninh Binh":{}, "Ninh Thuan":{}, "Phu Tho":{}, "Phu Yen":{}, "Quang Binh":{}, "Quang Nam":{}, "Quang Ngai":{}, "Quang Ninh":{}, "Quang Tri":{}, "Soc Trang":{}, "Son La":{}, "Tay Ninh":{}, "Thai Binh":{}, "Thai Nguyen":{}, "Thanh Hoa":{}, "Thua Thien-Hue":{}, "Tien Giang":{}, "Tra Vinh":{}, "Tuyen Quang":{}, "Vinh Long":{}, "Vinh Phuc":{}, "Yen Bai":{}, "Can Tho":{}, "Da Nang":{}, "Hai Phong":{}, "Hanoi":{}, "Ho Chi Minh":{},
         },
         "Yemen":{
           "Abyan":{}, "'Adan":{}, "Ad Dali'":{}, "Al Bayda'":{}, "Al Hudaydah":{}, "Al Jawf":{}, "Al Mahrah":{}, "Al Mahwit":{}, "'Amran":{}, "Dhamar":{}, "Hadramawt":{}, "Hajjah":{}, "Ibb":{}, "Lahij":{}, "Ma'rib":{}, "Sa'dah":{}, "San'a'":{}, "Shabwah":{}, "Ta'izz":{},
         },
        
         "Zambia":{
           "Central":{}, "Copperbelt":{}, "Eastern":{}, "Luapula":{}, "Lusaka":{}, "Northern":{}, "North-Western":{}, "Southern":{}, "Western":{},
         },
        
         "Zimbabwe":{
           "Bulawayo":{}, "Harare":{}, "Manicaland":{}, "Mashonaland Central":{}, "Mashonaland East":{}, "Mashonaland West":{}, "Masvingo":{}, "Matabeleland North":{}, "Matabeleland South":{}, "Midlands":{},
          },
          
      }, 
      

    }
  this.handleCaptchaResponseChange = this.handleCaptchaResponseChange.bind(this);
  this.StatehandleChange=this.StatehandleChange.bind(this);   
  this.CountryHandleChange = this.CountryHandleChange.bind(this);
  this.handleChangeCheck=this.handleChangeCheck.bind(this);  
  this.fileUpload=this.fileUpload.bind(this);
  this.timeZoneHandleChange= this.timeZoneHandleChange.bind(this);
  this.handleChange= this.handleChange.bind(this);
  this.selectHandleChange=this.selectHandleChange.bind(this);
  this.phoneHandleChange=this.phoneHandleChange.bind(this);
  this.codeHandleChange=this.codeHandleChange.bind(this);
  this.removeFile=this.removeFile.bind(this);
};
removeFile()
{
  const {user}=this.props.auth;
      let orgID=user.id;
    // alert("publisherID==="+orgID)
    let views="Publisher";
   
    let data={orgID:orgID,views:views}
    // alert("data====="+JSON.stringify(data))
    fetch("agencyOnBoardDetails/removeOrgLogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json())
    .then(logoRemove =>
      {
      
      this.setState({ isFileUpload: false ,fileUploadFlag:false})
    }).catch(function (err) {
      console.log(err)
    });
   
  // alert("remove file==>"+document.getElementById("adj_file").innerHTML)
  document.getElementById("adj_file").innerHTML=""; 
  let errors={}
    errors['Success']=""
  this.setState({errors:errors,fileUploadFlag:false})
  document.getElementById("logo").value=""; 
}

componentWillMount()
  {
   
    const {isAuthenticated, user} = this.props.auth;
    if(!this.props.auth.isAuthenticated) {
        this.props.history.push('/userLogin');
      }
      else{
    //  alert("Login Successful");

      //agencyDetails
      
     /* const {user,isAuthenticated} = this.props.auth;
      var pID=user.id;
       let data={pID:pID}   Priyanka--3944--removed params   */

       //getGDPRInfoForEdit
      
      //  fetch("/publisher/getGDPRInfoForEdit",{
      //   method:"POST",
      //   headers:{"Content-Type":"application/json"},
      //   body:JSON.stringify(data)
      // }).then(res=>res.json())
      // .then(publisherGdprInfo=>{
      //   // alert("here")
      //   // alert("publisherGdprInfo===>"+JSON.stringify(publisherGdprInfo))
      // }).catch(function (err) {console.log(err)});

      fetch("/publisher/publisherDetails",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          //body:JSON.stringify(data)
      }).then(res=>res.json())
      .then(publisherInfo=>{
        // alert("publisherInfo===>"+JSON.stringify(publisherInfo))
        //fileName:[publisherInfo[0].logoName]
          this.setState({publisherInfo:publisherInfo,countryCode:publisherInfo[0].countryCode,
            fileName:[publisherInfo[0].logoName]
            }
            
            ,function(){ 

              if(this.state.publisherInfo[0].dcEmail=="Yes"||this.state.publisherInfo[0].dcDisplay=="Yes"||this.state.publisherInfo[0].dcProgrammatic=="Yes"||this.state.publisherInfo[0].dcTelemarketing=="Yes"||this.state.publisherInfo[0].dcSocial=="Yes")
              {
                chkBoxLength = chkBoxLength + 1;
                // alert("chkBoxLength zero"+chkBoxLength);
                // this.setState({checkboxDisplay:"none"})
              }
              else
              {

                // alert("chkBoxLength zero");
                // let errors={}
                // errors["deliveryChannel"]="Please select min one delivery channel!";
                // this.setState({checkboxDisplay:"block"})
              }
              if(this.state.publisherInfo[0].logoName=="" || this.state.publisherInfo[0].logoName==undefined ){this.setState({fileUploadFlag:false})}
              else{
                if(this.state.publisherInfo[0].logoName.length>0){
                  this.setState({fileUploadFlag:true})
                }
              }
            }
            )
      }).catch(function (err) {console.log(err)});


      fetch("/publisher/publisherContactDetails", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        //body: JSON.stringify(data)
      }).then(res => res.json())
      .then(publisherContactDetails=> { 
        if(publisherContactDetails.length>1){  
        this.setState({publisherContactDetails:publisherContactDetails,
        contactperson1:[publisherContactDetails[0]],
        contactperson2:[publisherContactDetails[1]],
        countryPhone1:[publisherContactDetails[0].countryPhoneCode],
        countryPhone2:[publisherContactDetails[1].countryPhoneCode]
         } );
        } else{
            this.setState({publisherContactDetails:publisherContactDetails,
            contactperson1:[publisherContactDetails[0]],
            countryPhone1:[publisherContactDetails[0].countryPhoneCode]
             } );
        }

        //alert("publisherContactDetails"+JSON.stringify(publisherContactDetails));
        })
    }    


  }//end of componentDidMount

fileUpload(e)
{
  
  let fileName=e.target.files[0];
  //  var fileUploadFlag=true;
  //  this.setState({fileUploadFlag:fileUploadFlag})
  console.log("fileUploadFlag===>"+this.state.fileUploadFlag)
  var ext=fileName.name.split('.').pop()
  //alert("==="+ext)
  if(ext==="png"||ext==="svg"||ext==="jpeg"||ext==="jpg"||ext==="gif"||ext==="PNG"||ext==="SVG"||ext==="JPEG"||ext==="JPG"||ext==="GIF")
  //alert("fileName==="+fileName.name)
  //if(fileName.name!='')
   
  {
    let errors={}
    errors['Success']="File Updated Successfully"
    this.setState({fileName:fileName,errors:errors,displayErrorMsg1:"none"})

    let publisherInfo=[...this.state.publisherInfo]
    publisherInfo[0] = { ...publisherInfo[0], ["logoName"]: fileName.name};
    this.state.publisherInfo=[...publisherInfo];
    this.setState({publisherInfo1:publisherInfo,logo:fileName,errors:errors, isFileUpload:true,displayErrorMsg1:"none",fileUploadFlag:true})
    console.log("file==>"+JSON.stringify(fileName.name))
  console.log(JSON.stringify(publisherInfo))
  }
  else
  {
    let errors={}
    errors['invalidFile']="Please Upload File Of jpg/png/svg/gif Format Only"
    this.setState({errors:errors,fileUploadFlag:false,isFileUpload:false})
  }




 
}
timeZoneHandleChange = (value) => 

  {
   this.setState({timeZone:value});
  var timeZoneSelected=value.name;
  this.setState({timeZone:value,timeZone1:value.name});
  let publisherInfo=[...this.state.publisherInfo]
  //alert("pubinfo==="+JSON.stringify(publisherInfo))
    publisherInfo[0] = { ...publisherInfo[0], ["timezone"]: value.name };
    this.state.publisherInfo=[...publisherInfo];
  //  alert("pubinfo==="+JSON.stringify(publisherInfo))
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 
  }


  handleChangeCheck(e) {
    let fields = this.state;
    if (e.target.checked === true) {
      fields[e.target.name] = 'Yes'
      chkBoxLength = chkBoxLength + 1;
    } else {
      fields[e.target.name] = 'No'
    }
    let { name, checked } = e.target;
    if (checked === true) {
      checked = 'Yes'
    } else {
      checked = 'No'
    }
    let publisherInfo = [...this.state.publisherInfo]
    publisherInfo[0] = { ...publisherInfo[0], [name]: checked };
    this.state.publisherInfo = [...publisherInfo];
    this.setState({ publisherInfo1: publisherInfo, isChecked: !this.state.isChecked, checkboxDisplay: 'none' });
  }
  

  StatehandleChange(value)
  {
  this.setState({state:value,state1:value.name});
  let publisherInfo=[...this.state.publisherInfo]
   //alert("pubinfo==="+JSON.stringify(publisherInfo))
     publisherInfo[0] = { ...publisherInfo[0], ["state"]: value.name };
     this.state.publisherInfo=[...publisherInfo];
   //alert("pubinfo==="+JSON.stringify(publisherInfo))
    this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
  }


CountryHandleChange(value) 
{
//alert("value==="+value.name)
this.setState({country:value});
let publisherInfo=[...this.state.publisherInfo]
//alert("pubinfo==="+JSON.stringify(publisherInfo))
  publisherInfo[0] = { ...publisherInfo[0], ["country"]: value.name };
  this.state.publisherInfo=[...publisherInfo];
//alert("pubinfo==="+JSON.stringify(publisherInfo))
 this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})

var countrySelected=value.name;

var CountriesStateArray =this.state.CountriesStateArray;
 var  stateArray=[];

 

    for (var state in CountriesStateArray[countrySelected])
 {
  stateArray.push({id:state, name:state});
  }

  
 ////Sort Array Alphabatically
 
var i;
var newStateArray=[];

  for(i=0;i<stateArray.length;i++)
  {
   
  newStateArray.push({id:stateArray[i].name, name:stateArray[i].name});

  }
  this.setState({stateoptions:newStateArray,country1:value.name})
}


  
 
  handleCaptchaResponseChange(response) {
    this.setState({
      recaptchaResponse: response,
    });
  //  alert("recaptchaResponse===>"+this.state.recaptchaResponse);
    let data={recaptcha:this.state.recaptchaResponse }
              fetch("/publisherOnBoardDetails/recaptcha", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
              }).then(res=>res.json()).then(res=>{
             // alert("Captcha response====>"+JSON.stringify(res.success))
                if(res.success==true)
                {
                  this.setState({
                    buttonDisplay: "btn add-button",
                  });
                }
              }).catch(function (err) {console.log(err)});

  }
  handleSubmit=e=> {
    e.preventDefault();
    
            // this.updateApi();

    var pubInfo=[...this.state.publisherInfo]
    var pubContact1=[...this.state.contactperson1]
    var pubContact2=[...this.state.contactperson2]
    //  var countryCode1=[...this.state.countryPhone1]
    //  var countryCode2=[...this.state.countryPhone2]
    // ||chkBoxLength==0
    // var pudAdd=pubInfo.concat(pubContact)
   this.props.form.validateFieldsAndScroll((err, values) => {
     //alert("chkBoxLength outside===>");
     var remove = document.getElementById("adj_file").innerHTML;
let errors={}
//alert("error==="+chkBoxLength);
      
      if(values.prefix2=="Select"||values.prefix=="Select"||this.state.recaptchaResponse=="")
      {
        // ||this.state.fileUploadFlag==false|| remove==""
        // if(this.state.fileUploadFlag==false){
  
        //   this.setState({displayErrorMsg1:"block"})
        //  }
        //  if(remove ==""){
        //   this.setState({displayErrorMsg1:"block"})
        //  }
        if(values.prefix2=="Select")
        {
          errors["PhoneCodeError2"]=<li style={{color:'#f5222d',paddingLeft:'206px'}}>Please select Phone Code !</li>
          this.setState({errors:errors})
        }
        if(values.prefix=="Select")
        {
          errors["PhoneCodeError"]=<li style={{color:'#f5222d',paddingLeft:'206px'}}>Please select Phone Code !</li>
          this.setState({errors:errors})
        }
        

        // if(chkBoxLength==0)
        //   {
        //     //alert("min one")       
        //     errors["deliveryChannel"]="Please select minimum one delivery channel !";
        //     this.setState({errors:errors})
            
        //   } 
          if(this.state.recaptchaResponse=="")
          {
                   
            errors["captchaResponse"]="Please Fill The Captcha !";
            this.setState({errors:errors})
            
          } 
          if(this.state.timeZone=="")
          {
                   
            errors["timeZone"]="Please Fill The timeZone!";
            this.setState({errors:errors})
            
          } 
     }
   
                
     else{
//alert("submit is in else")
if(this.state.fileUploadFlag==true){
  
  this.setState({displayErrorMsg1:"none"})
 }
 if(remove !==""){
  this.setState({displayErrorMsg1:"none"})
 }

     if (!err) {

        // alert("Not Error");
      //alert("chkBoxLength inside===>"+chkBoxLength);
      var contactInfo=[];
      var contactPerson2=values.contactPerson2;
      if(contactPerson2===undefined || contactPerson2===null){contactPerson2=''}
      var contactPerson2LastName=values.contactPerson2LastName;
      if(contactPerson2LastName===undefined || contactPerson2LastName===null){contactPerson2LastName=''}
      var designation2=values.designation2;
      if(designation2===undefined || designation2===null){designation2=''}
      var contactEmail2=values.contactEmail2;
      if(contactEmail2===undefined || contactEmail2===null){contactEmail2=''}
      var phone2=values.phone2;
      if(phone2===undefined || phone2===null){phone2=''}
      if(contactPerson2===undefined || contactPerson2===null || contactPerson2==="" || contactPerson2===''){
        contactInfo=[{'contactID':1,'contactPerson':values.contactPerson,'lastName':values.contactPerson1LastName,'designation':values.designation,'email':values.contactEmail1,countryPhoneCode:values.prefix2,'phoneNo':values.phone1}]
      }else{
        contactInfo=[{'contactID':1,'contactPerson':values.contactPerson,'lastName':values.contactPerson1LastName,'designation':values.designation,'email':values.contactEmail1,countryPhoneCode:values.prefix2,'phoneNo':values.phone1},{'contactID':2,'contactPerson':contactPerson2,'lastName':contactPerson2LastName,'designation':designation2,'email':contactEmail2,countryPhoneCode:values.prefix3,'phoneNo':phone2}]
      }
      
        //alert(JSON.stringify(contactInfo));
     var contactPersonEmail=values.contactEmail1;
         //Saurabh-task-3795- Commented data because Publisher Information is not able to save.

      // let data={
      //     companyName:this.state.companyName,
      //     website:this.state.website,
      //     email:this.state.pubEmail,
      //     phone:this.state.phone,
      //     country:this.state.country1,
      //     state:this.state.state1,
      //     city:this.state.city,
      //     zipCode:this.state.zipCode,
      //     prefix:values.prefix,
      //     dcEmail:this.state.dcEmail,
      //     dcTelemarketing:this.state.dcTelemarketing,
      //     dcDisplay:this.state.dcDisplay,
      //     dcProgrammatic:this.state.dcProgrammatic,
      //     dcSocial:this.state.dcSocial,
      //     contactInfo:contactInfo,
      //     contact1Email:contactPersonEmail,
      //     address:this.state.address
      //  }
            // let data={
            // pubInfo:pubInfo,
            // pubContact1:pubContact1,
            // pubContact2:pubContact2
            // } 
           //Saurabh-task-3795- Uncommented data because Publisher Information is not able to save.
       var data = new FormData();  //snehal-task-3353-Code Error- Front End Code Error after installing npm

       //data.append("file",this.state.fileName);
      // alert("fileUploadFlag===>"+this.state.fileUploadFlag)
      if(this.state.fileUploadFlag===true){
       data.append("fileName",this.state.fileName);
      }
      // if(this.state.isFileUpload){
      //   data.append("fileName",this.state.fileName);
      // }
        data.append("fileUploadFlag",this.state.isFileUpload)
      // data.append("fileUploadFlag",this.state.fileUploadFlag)
       data.append("pubInfo",JSON.stringify(pubInfo));
       data.append("pubContact1",JSON.stringify(pubContact1));
       data.append("pubContact2",JSON.stringify(pubContact2));
      let formIsValid=true;

        
        //alert("in fetch block===")
        this.setState({
          errors:''
        })
     
        //       /** this route for registeration of publisher */
                // alert("record being proessed")
               fetch("publisher/editPublisherInfo", {
                method: "POST",
               //headers: { "Content-Type": "application/json" },
               body:data
               }).then(res=>res.json()).then(res=>{
                          //alert("in fetch block==="+JSON.stringify(res))
                     if(res.success==true)
                     {
                      //alert("contact2"+JSON.stringify(pubContact2))
                       Swal.fire({
                         type:'success',
                         text:'Publisher details edited  successfully !',
                       })
                       this.setState({
                        buttonDisplay:'disabled'});  //Priyanka--3966--disabled Save and Next button after success
                       }
                 }).catch(function (err) {console.log(err) });
         }
       }
       
   });
  };
  checkCheckBox = (rule, value, callback) => {
    
    if (!value) {
      callback('Please agree the terms !');
    } else {
      callback();
    }
};

 

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  compareToFirstPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && value !== form.getFieldValue('password')) {
      callback('Two passwords that you enter is inconsistent!');
    } else {
      callback();
    }
  };

  validateToNextPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    callback();
  };

  handleWebsiteChange = value => {

    let autoCompleteResult;
    if (!value) {
      autoCompleteResult = [];
    } else {
      autoCompleteResult = ['.com', '.org', '.net'].map(domain => `${value}${domain}`);
    }
    this.setState({ autoCompleteResult,website:value });
    let publisherInfo=[...this.state.publisherInfo]
     publisherInfo[0] = { ...publisherInfo[0], ["website"]: value };
     this.state.publisherInfo=[...publisherInfo];
    this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
   };

phoneHandleChange(value){
   this.setState({selectValue:value,select1:value.name});
   this.setState({countryPhone1:value},function(){console.log(this.state.countryPhone1)})
   let contactperson1=[...this.state.contactperson1]
   contactperson1[0] = { ...contactperson1[0], "countryPhoneCode": value };
   this.state.contactperson1=[...contactperson1];
}
codeHandleChange(value){
  this.setState({selectValue:value,select1:value.name});
  this.setState({countryPhone2:value},function(){console.log(this.state.countryPhone2)})
  let contactperson2=[...this.state.contactperson2]
  contactperson2[0] = { ...contactperson2[0], "countryPhoneCode": value };
  this.state.contactperson2=[...contactperson2];
}


selectHandleChange(value){
  this.setState({selectValue:value,select1:value.name});
   let countryCode=[...this.state.countryCode]
   this.state.countryCode=[...countryCode];
   this.setState({countryCode:value},function(){console.log(this.state.countryCode)})
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["countryCode"]: value };
   this.state.publisherInfo=[...publisherInfo];
}



 handleChange(e){
   const{name,value}=e.target
 if(name=="companyName")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["publisherName"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }
 if(name=="pubEmail")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["email"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }
 if(name=="phone")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["phone"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }


 if(name=="zipCode")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["zipcode"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }
 if(name=="address")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["address"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }
 if(name=="city")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["city"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }


 if(name=="contactp")
 {
   let contactperson1=[...this.state.contactperson1]
   contactperson1[0] = { ...contactperson1[0], ["firstName"]: value };
   this.state.contactperson1=[...contactperson1];
   this.setState({contactPerson1Deatils:contactperson1},function(){console.log(this.state.contactperson1)})
 }
 if(name=="contactp1lastname")
 {
   let contactperson1=[...this.state.contactperson1]
   contactperson1[0] = { ...contactperson1[0], ["lastName"]: value };
   this.state.contactperson1=[...contactperson1];
   this.setState({contactPerson1Deatils:contactperson1},function(){console.log(this.state.contactperson1)})
 }
 if(name=="designation")
 {
   let contactperson1=[...this.state.contactperson1]
   contactperson1[0] = { ...contactperson1[0], ["designation"]: value };
   this.state.contactperson1=[...contactperson1];
   this.setState({contactPerson1Deatils:contactperson1},function(){console.log(this.state.contactperson1)})
 }
 if(name=="contactEmail1")
 {
   let contactperson1=[...this.state.contactperson1]
   contactperson1[0] = { ...contactperson1[0], ["email"]: value };
   this.state.contactperson1=[...contactperson1];
   this.setState({contactPerson1Deatils:contactperson1},function(){console.log(this.state.contactperson1)})
 }
 if(name=="phone1")
 {
   let contactperson1=[...this.state.contactperson1]
   contactperson1[0] = { ...contactperson1[0], ["phoneNo"]: value };
   this.state.contactperson1=[...contactperson1];
   this.setState({contactPerson1Deatils:contactperson1},function(){console.log(this.state.contactperson1)})
 }



 if(name=="contactp2")
 {
   let contactperson2=[...this.state.contactperson2]
   contactperson2[0] = { ...contactperson2[0], ["firstName"]: value };
   this.state.contactperson2=[...contactperson2];
   this.setState({contactPerson2Deatils:contactperson2},function(){console.log(this.state.contactperson2)})
 }
 if(name=="contactp2lastname")
 {
   let contactperson2=[...this.state.contactperson2]
   contactperson2[0] = { ...contactperson2[0], ["lastName"]: value };
   this.state.contactperson2=[...contactperson2];
   this.setState({contactPerson2Deatils:contactperson2},function(){console.log(this.state.contactperson2)})
 }
 if(name=="designation2")
 {
   let contactperson2=[...this.state.contactperson2]
   contactperson2[0] = { ...contactperson2[0], ["designation"]: value };
   this.state.contactperson2=[...contactperson2];
   this.setState({contactPerson2Deatils:contactperson2},function(){console.log(this.state.contactperson2)})
 }
 if(name=="contactEmail2")
 {
  let contactperson2=[...this.state.contactperson2]
  contactperson2[0] = { ...contactperson2[0], ["email"]: value };
  this.state.contactperson2=[...contactperson2];
  this.setState({contactPerson2Deatils:contactperson2},function(){console.log(this.state.contactperson2)})
 }
 if(name=="phone2")
 {
  let contactperson2=[...this.state.contactperson2]
  contactperson2[0] = { ...contactperson2[0], ["phoneNo2"]: value };
  this.state.contactperson2=[...contactperson2];
  this.setState({contactPerson2Deatils:contactperson2},function(){console.log(this.state.contactperson2)})
 }
 }




  render() {
   
    const { getFieldDecorator,getFieldValue } = this.props.form;
    const { autoCompleteResult } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 16,
          offset: 8,
        },
      },
    };
    const phonePrefix=["1","7","20","27","30","32","33","34","36","39","40","41","43","44","45","46","47","48","49","51","52","53","54","55","56","57","58","60","61","62","63","64","65","66","76","77","81","82","84","86","87","90","91","92","93","94","95","98","211","212","213","216","218","220","221","222","223","224","225","226","227","228","229","230","231","232","234","235","236","237","238","239","240","241","242","243","244","245","246","247","248","249","250","251","252","254","255","256","257","258","260","261","262","263","264","265","266","267","268","269","290","291","297","298","299","350","351","352","353","354","355","356","357","358","359","370","371","372","373","374","375","376","377","378","380","381","382","383","385","386","387","389","420","421","423","500","501","502","503","504","505","506","507","508","509","590","591","592","594","595","596","597","598","670","672","673","674","675","676","677","678","679","680","681","682","683","685","686","687","688","689","690","691","692","800","850","852","853","855","856","870","878","880","881","882","883","886","888","942","960","961","963","964","965","966","967","968","970","971","972","973","974","975","976","977","979","992","993","994","995","996","998","1242","1246","1248","1264","1268","1284","1340","1345","1441","1473","1649","1664","1670","1671","1684","1721","1758","1784","1787","1808","1809","1829","1849","1868","1869","1876","1939","2908","3732","3735","4428","4779","5399","5993","5994","5997","5999","6721","6723","7840","7940","8810","8811","8812","8813","8816","8817","8818","8819","35818","37447","37449","37744","37745","38128","38129","38138","38139","38643","38649","88213","88216","90392","262269","262639","441481","441534","441624","447524","447624","447781","447839","447911","447924","6189162","6189164"];
   
    const prefixSelector = getFieldDecorator('prefix', {
      initialValue: this.state.countryCode,
    })(
      <Select style={{ width: 110 }} value={this.state.selectValue} 
      onChange={this.selectHandleChange}  showSearch >
        {phonePrefix.map(a=>(
        <Option value={a}>+ {a}</Option>
        ))}
      </Select>,
       );
      const prefixSelector2 = getFieldDecorator('prefix2', {
        initialValue: this.state.countryPhone1
      })(
        <Select style={{ width: 110 }} value={this.state.selectValue} name="countryPhoneCode"
        onChange={this.phoneHandleChange} showSearch >
        {phonePrefix.map(a=>(
        <Option value={a}>+ {a}</Option>
        ))}
      </Select>,
      );
  
  
      const prefixSelector3 = getFieldDecorator('prefix3', {
        initialValue: this.state.countryPhone2,
      })(
        <Select style={{ width: 110 }} value={this.state.selectValue} name="countryPhoneCode"
        onChange={this.codeHandleChange} showSearch >
        {phonePrefix.map(a=>(
        <Option value={a}>+ {a}</Option>
        ))}
      </Select>,
        
  
       );

 
    

   

    const websiteOptions = autoCompleteResult.map(website => (
      <AutoCompleteOption key={website}>{website}</AutoCompleteOption>
    ));
   
    return (
      <div>
      
      <div class="container-fluid">
      <br/><br/>
      <div style={{ fontSize: '22px', color: 'green',paddingLeft:'450px'}}>{this.state.onBoardMessage}</div>
          <br/>
    
  <Form id='formId'{...formItemLayout} onSubmit={this.handleSubmit} >
<div class="row">

 
<div class=" col-xs-12  col-sm-12 col-md-6 col-lg-6">
{this.state.publisherInfo.map(publisherInfo => (  
  <Form.Item
          label={
            <span>
            Publisher Name&nbsp;
              <Tooltip title="Publisher Registered Name">
                <Icon type="question-circle-o" />
              </Tooltip>
            </span>

          }
        >
          {getFieldDecorator('companyName', {
            initialValue:publisherInfo.publisherName,
            rules:
             [{ pattern:/^[a-zA-Z\s\.]+$/,required: true, message: 'Please input your publisher name !', whitespace: true }],
          })
          (<Input  onChange={this.handleChange}  id="companyName" name="companyName" />)
          }
        </Form.Item>
            ))}
        </div>

       

        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        {/* ^((https?|ftp|smtp):\/\/)?(www.)?[a-zA-Z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$ */}
        {/* ^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&\(\)\*\+,;=.]+$ */}
        {this.state.publisherInfo.map(publisherInfo => (
        <Form.Item label="Website">
              {getFieldDecorator('website', {
              initialValue:publisherInfo.website,
             //rules: [{pattern:'(http:\/\/|https:\/\/)?(www.)?([a-zA-Z0-9]+).[a-zA-Z0-9]*.[a-z]{3}.?([a-z]+)?',required: true, message: 'Please input website !'}],
             //rules: [{pattern:"((https?:\/\/)?(www\.)?[\`|\~|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\+|\=|\[|\{|\]|\}|\||\\|\'|\<|\,|\.|\>|\?|\/|\"|\;|\:\s]([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?",required: true, message: 'Please input website !'}]
             //rules: [{pattern:/^[-_,A-Za-z0-9],required: true, message: 'Please input website !'}],
             rules: [{pattern:"^((http:\/\/www(?!.*?[.]{2}))|(www(?!.*?[.]{2}))|(http:\/\/))(?!.*?[.]{2})[a-zA-Z0-9._ -]+\.[a-zA-Z.]{2,5}$",required: true, message:'Please input valid website. e.g.(www.colorlib.com)'}]
              //rules: [{pattern:"/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]"}] ,               
          })(
              <AutoComplete
              dataSource={websiteOptions}
              onChange={this.handleWebsiteChange}
              placeholder="website"
              >
              <Input />
              </AutoComplete>,
              )}
              </Form.Item>
        ))}
                      </div>
 </div>  
 {/* {/ End of 1st Row /} */}
 

 <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">
{this.state.publisherInfo.map(publisherInfo => (
  <Form.Item
									label={
										<span>
											E-mail&nbsp;
											<Tooltip title="It Only Accepts Business E-mail Address"> {/*saurabh - 3745 added Tooltip Accepts Business Email Address*/}
												<Icon type="question-circle-o" />
											</Tooltip>
										</span>
									}>
          {getFieldDecorator('pubEmail', {
            initialValue:publisherInfo.email,
            rules: [
           {
            //saurabh - 3745- changed RegEx, user should not be able to add social domain.
              //Sandeep-task-3893-Production issue-Email format issue--All roles
            pattern:/^\s*$|^[\.a-zA-Z0-9_%+]+[\w-]+[a-zA-Z0-9_%+]+(\.[a-zA-Z0-9]+)*@(?!gmail.com)(?!gmail.co.in)(?!yahoo.com)(?!yahoo.co.in)[a-zA-Z0-9]+[\w-]+[a-zA-Z0-9]+\.([a-zA-Z]{3,5}|[a-zA-z]{2,5}\.[a-zA-Z]{2,5})/,

// pattern:  /^[a-zA-Z0-9._%+-]+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,
               // type: 'email',
                message: 'The input is not valid E-mail !',
              }, 
              {
                required: true,
                message: 'Please input your E-mail !',
              },
            ],
          })(<Input  onChange={this.handleChange} id="pubEmail" name="pubEmail" />)}
         
        </Form.Item>
))}
        </div>
 
        <div class=" col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        {this.state.publisherInfo.map(publisherInfo => (
       <Form.Item label="Phone Number">
         {getFieldDecorator('phone', {
           initialValue:publisherInfo.phone,
           rules :[{pattern:/^[0-9][0-9]{2,12}$/, required:true,message:"Please enter a valid phone number"}]
         })(<Input  addonBefore={prefixSelector} style={{ width: '100%' }} onChange={this.handleChange} id="phone" name="phone"  />)}
       </Form.Item>
        ))}
       <div class="errorMessage">{this.state.errors.PhoneCodeError2}</div>
       </div>
         
 </div>
 {/* {/ End of 2nd Row /} */}

 <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
{/* <span style={{color:"red"}}>*</span> */}
{this.state.publisherInfo.map(publisherInfo => (
<Form.Item label="Country">
{getFieldDecorator('Country', {
            initialValue:publisherInfo.country,
            rules: [{required: true, message: 'Please input your Country !' }],
          })
(<Picky  
                value={this.state.country} 
                options={CountriesArray1}
                onChange={this.CountryHandleChange}
                // className={this.state.inputClassregion}
                open={false}
                valueKey="id"
                labelKey="name"
                multiple={false}
                includeFilter={true}
                dropdownHeight={200}
                id="country" name="country"
/>)} 
              </Form.Item>
))}
</div>

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
{this.state.publisherInfo.map(publisherInfo => (
<Form.Item label="State">
{getFieldDecorator('State', {
       initialValue:publisherInfo.state,
      //  required: true,
  // rules: [{ message: 'Please input your State !' }],
})

(<Picky        
                value={this.state.state} 
                options={this.state.stateoptions}
                onChange={this.StatehandleChange}
                // className={this.state.inputClassregion}
                open={false}
                valueKey="id"
                labelKey="name"
                multiple={false}
                includeFilter={true}
                dropdownHeight={200}
                id="state" name="state"
              />)}
              </Form.Item>
))} 
  </div>
 
 </div>
  {/*end of 3rd row */}
       <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
{this.state.publisherInfo.map(publisherInfo => (

  <Form.Item
          label={
            <span>
            City
            </span>
          }
        >
          {getFieldDecorator('city', {
            initialValue:publisherInfo.city,
            rules: [{pattern:/^[A-Za-z\s]+$/, required: true, message: 'Please input your city!', whitespace: true }],
          })(<Input onChange={this.handleChange} id="city" name="city" />)}
        </Form.Item>
))}
       
        </div>
 
        <div class=" col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        {this.state.publisherInfo.map(publisherInfo => (

        <Form.Item label="Zip/Postal Code">
          {getFieldDecorator('Zip Code', {
            initialValue:publisherInfo.zipcode,
            // required: true,
             rules: [{ pattern:/^[0-9\b]+$/, message: 'Please input Zip/Postal Code !' }],
          })(<Input onChange={this.handleChange} id="zipCode" name="zipCode" />)}
        </Form.Item>
        ))}
        </div> 
       
 </div> 

   {/* {/ End of 4th row /} */}
   <div class="row">
   
        
<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
{/* <span style={{color:"red"}}>*</span> */}
{this.state.publisherInfo.map(publisherInfo => (
<Form.Item label="Time Zone">
{getFieldDecorator('timeZone', {
                initialValue:publisherInfo.timezone,
            rules: [{required: true, message: 'Please input your Time Zone !' }],
          })
(<Picky  
                value={this.state.timeZone} 
                options={TimeZoneOption}
                onChange={this.timeZoneHandleChange}
                // className={this.state.inputClassregion}
                open={false}
                valueKey="id"
                labelKey="name"
                multiple={false}
                includeFilter={true}
                dropdownHeight={200}
                id="time" name="time"
/>)} 
              </Form.Item>
))}
</div>
<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
{this.state.publisherInfo.map(publisherInfo => (

        <Form.Item label="Address">
        {getFieldDecorator('Address', { 
              initialValue:publisherInfo.address,
           rules: [{ required: true, message: 'Please Enter Address!' }],
          })
          (
           <TextArea rows={2} id="address" name="address" style={{resize:'none',height:'50px',lineHeight:'28px'}} onChange={this.handleChange}></TextArea>
          )
          }
        </Form.Item>
))}
        </div>
</div>

  <div class="row">
    
   {/* <div class="col-xs-12  col-sm-12 col-md-12 col-lg-12">  */}
   {/* <div class="col-xs-2 col-sm-2 col-md-2 col-lg-2" style={{textAlign:'right'}}> */}
   <div class="col-sm-2 col-md-3 col-lg-2 offset-lg-1">
      < label style={{color:'black',fontWeight:'bold'}}><span style={{color:'red'}}> *</span>Delivery Channel :</label>
     
  </div> 


  <div  class="logo-1 col-xs-6  col-sm-6 col-md-6 offset-md-4 col-lg-4 offset-lg-3" style={{height:0}}>
  {/* <div class="col-xs-12 col-sm-12 col-md-3 col-lg-4" style={{height:0}}> */}
  {/* <span style={{color:'red'}}> *</span> */}
             {this.state.publisherInfo.map(publisherInfo => ( 
        <Form.Item style={{width:'153%',right:'0px'}}>
           < label id="file"style={{color:'black',fontWeight:'bold',marginLeft:"160px"}}>Logo :&nbsp;</label>
          {/* {publisherInfo.logoName} */}
    {/* {this.state.fileName} */}
{/* {getFieldDecorator('logo', {
    value:publisherInfo.logoName,
    rules: [{  message: 'Please Enter Logo!' }],
  })
  (
  <Input type="file"  onChange={this.fileUpload} style={{paddingBottom: "32px"}}
 
  />
  
  )
  
  } */}
    <label class="chooseFile btn btn-default">Choose File<input  type="file" id="logo" style={{display:"none",width:"40px" , height:"100px"}}
  onChange={this.fileUpload}/>
  </label>
  {this.state.fileUploadFlag==false?
  ""
  :
  <a href="#" id="btn-example-file-reset" onClick={this.removeFile}>Remove </a>
  }
 
  <span class="errorMessage" style={{display:this.state.displayErrorMsg1}} ><li id="logoMsg"style={{paddingLeft:'200px',marginTop:'-10px'}}>
    Please Enter Logo!
  </li></span>
  <br/>



     {this.state.fileUploadFlag==false?
 
    <span> 
      <b id="upload_logo"style={{paddingLeft:'160px',lineHeight:'10px'}}>Uploaded file:<p id="adj_file" 
    style={{whiteSpace:'nowrap',width:'50px',overflow:'hidden',textOverflow:'ellipsis',marginLeft:'260px',marginTop:'-25px'}}></p></b>
   </span>
   
      : 

     <span>
       <b id="upload_logo"style={{paddingLeft:'160px',lineHeight:'10px'}}>Uploaded file:<p id="adj_file" 
     style={{whiteSpace:'nowrap',width:'50px',overflow:'hidden',textOverflow:'ellipsis',marginLeft:'260px',marginTop:'-25px'}}>{publisherInfo.logoName}</p></b>
      </span>
  }

  <span class="successMessage" id="succ_Msg" style={{paddingLeft:'200px'}}>{this.state.errors.Success}</span>
  
           <span class="errorMessage"><li id="invalid_file" style={{paddingLeft:'210px',lineHeight:'20px',marginTop:'-45px'}}>{this.state.errors.invalidFile}</li></span>
</Form.Item>
             ))}
           </div>
           <br/>
           </div>
  {/* checked={this.state.publisherInfo.dcEmail==="Yes"?"Yes":"No"} */}
  {/* <div class="col-xs-12 col-sm-12 col-md-6 col-lg-2">  */}
  <div class="row">
  <div class="col-xs-12 col-sm-12 col-md-6 offset-md-2 col-lg-2 offset-lg-2"> 
  {this.state.publisherInfo.map(item => (
              <Checkbox  id="dcEmail" defaultChecked={item.dcEmail=='Yes'?true:false} name="dcEmail" onChange={this.handleChangeCheck}   style={{color:'black',fontWeight:'bold',marginLeft:"10px"}}>Email</Checkbox>
  ))}
              </div>
</div>
              {/* <div class="col-xs-12 col-sm-12 col-md-6 col-lg-2"> */}
              <div class="row">
              <div class="col-xs-12 col-sm-12 offset-md-2 col-md-6 col-lg-2 offset-lg-2">
              {this.state.publisherInfo.map(item => (
              <Checkbox   id="dcTelemarketing" defaultChecked={item.dcTelemarketing=='Yes'?true:false} name="dcTelemarketing" onChange={this.handleChangeCheck}  style={{color:'black',fontWeight:'bold',marginLeft:"10px"}}>Telemarketing</Checkbox>
              ))}
            </div>
           </div>
          
          
           <div class="row">
           <div class="col-xs-12 col-sm-12 col-md-6 offset-md-2 col-lg-2 offset-lg-2">
            {/* <div class="col-xs-12 col-sm-12 col-md-6 col-lg-2"> */}
            {this.state.publisherInfo.map(item => (
              <Checkbox  id="dcProgrammatic"  defaultChecked={item.dcProgrammatic=='Yes'?true:false} name="dcProgrammatic" onChange={this.handleChangeCheck} style={{color:'black',fontWeight:'bold',marginLeft:"10px"}}>Programmatic</Checkbox>
            ))}
              </div>
           </div>
            {/* <div class=" col-xs-12 col-sm-12 col-md-6 col-lg-2"> */}
            <div class="row">
            <div class=" col-xs-12 col-sm-12 col-md-6 offset-md-2 col-lg-2 offset-lg-2">
            {this.state.publisherInfo.map(item => (
               <Checkbox   id="dcSocial" defaultChecked={item.dcSocial=='Yes'?true:false}name="dcSocial" onChange={this.handleChangeCheck} style={{color:'black',fontWeight:'bold',marginLeft:"10px"}}>Social</Checkbox>
            ))}
               </div>
               </div>
            {/* <div class="col-xs-12 col-sm-12 col-md-3 col-lg-8"> */}
            <div class="row">
            <div class=" col-xs-12 col-sm-12 col-md-6 offset-md-2 col-lg-2 offset-lg-2">
            {this.state.publisherInfo.map(item => (
              <Checkbox  id="dcDisplay" defaultChecked={item.dcDisplay=='Yes'?true:false}name="dcDisplay" onChange={this.handleChangeCheck} style={{color:'black',fontWeight:'bold',marginLeft:"10px"}} >Display</Checkbox>
            ))}  
            </div>
  </div>

           
   <div class="row">
     <div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">
    <div class="col-lg-12 offset-lg-10"> 
     <div style={{color:'red',fontSize:'14px',textAlign:'right'}}>{this.state.errors.deliveryChannel}</div>
  {/* <div style={{color:'red',fontSize:'12px'}}>{this.state.errors.deliveryChannel}</div>  */}
     </div>
     </div>
    

  </div>
 
  
 
  {/* </div> */}
  {/* {/ End of 5th row /} */}
  <div class="row" >
<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6" style={{marginTop:'15px'}}>

  <Form.Item
          label={
            <span>
            Contact Person 1&nbsp;
           
            </span>
          }
          />
          </div>
          <div  class="col-xs-12  col-sm-12 col-md-6 col-lg-6" style={{marginTop:'15px'}}>
          <Form.Item
          label={
            <span>
            Contact Person 2&nbsp;
           
            </span>
          }
          />  
           </div>
     </div>
       
  
 
 
    
<div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">
{this.state.contactperson1.map(contactperson1 => (
  <Form.Item
          label={
            <span>
            First Name&nbsp;
           
            </span>
          }
        >
          {getFieldDecorator('contactPerson', {
            initialValue:contactperson1.firstName,
            rules: [{pattern:/^[A-Za-z\s]+$/,message: 'Please enter the name !', whitespace: true, required: true}],
          })(<Input  onChange={this.handleChange} id="contactp" name="contactp" />)}
           
           </Form.Item>
))}

        </div>
        {this.state.publisherContactDetails.length>1 ?
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        {this.state.contactperson2.map(contactperson2 => (
        <Form.Item label={<span> First Name&nbsp;
          
        </span>
        }>
          {getFieldDecorator('contactPerson2', {
            initialValue:contactperson2.firstName,
            rules: [{ pattern:/^[A-Za-z\s]+$/,message: 'Please enter the name !' }],
          })(<Input  onChange={this.handleChange} id="contactp2" name="contactp2" disabled={this.state.displayContact2} />)}
        </Form.Item>
        ))}
        </div>
        :<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        
        <Form.Item label={<span> First Name&nbsp;
          
        </span>
        }>
          {getFieldDecorator('contactPerson2', {
            
            rules: [{ pattern:/^[A-Za-z\s]+$/,message: 'Please enter the name !' }],
          })(<Input  onChange={this.handleChange} id="contactp2" name="contactp2" disabled={this.state.displayContact2} />)}
        </Form.Item>
       
        </div>}
  
 </div>
       
 {/* End of 1st Row */}
 
 <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
{this.state.contactperson1.map(contactperson1 => (
  <Form.Item
          label={
            <span>
            Last Name&nbsp;
          
            </span>
          }
        >
          {getFieldDecorator('contactPerson1LastName', {
             initialValue:contactperson1.lastName,
            rules: [{ pattern:/^[A-Za-z\s]+$/,required: true, message: 'Please enter the last name !' }],
          })(<Input onChange={this.handleChange} id="contactp1lastname" name="contactp1lastname" disabled={this.state.displayContact1}onKeyPress={this.onKeyPress}/>)}
           </Form.Item>
))}

        </div>
        {this.state.publisherContactDetails.length>1 ? 
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        {this.state.contactperson2.map(contactperson2 => (
        <Form.Item label={<span>Last Name
        </span>
        }>
          {getFieldDecorator('contactPerson2LastName', {
            initialValue:contactperson2.lastName,
            rules: [{ pattern:/^[A-Za-z\s]+$/, message: 'Please enter the last name!' }],
          })(<Input onChange={this.handleChange} id="contactp2lastname" name="contactp2lastname" disabled={this.state.displayContact2} />)}
        </Form.Item>
      ))}
        </div>
        :<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        
        <Form.Item label={<span>Last Name
        </span>
        }>
          {getFieldDecorator('contactPerson2LastName', {

            rules: [{ pattern:/^[A-Za-z\s]+$/, message: 'Please enter the last name!' }],
          })(<Input onChange={this.handleChange} id="contactp2lastname" name="contactp2lastname" disabled={this.state.displayContact2} />)}
        </Form.Item>
        </div>}
 </div>  
 
 
 <div class="row">
<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
{this.state.contactperson1.map(contactperson1 => (
  <Form.Item
          label={
            <span>
            Designation&nbsp;
           
            </span>
          }
        >
          {getFieldDecorator('designation', {
             initialValue:contactperson1.designation,
            rules: [{ pattern:/^[A-Za-z\s]+$/,required: true, message: 'Please input the designation !', whitespace: true }],
          })(<Input onChange={this.handleChange} id="designation" name="designation" disabled={this.state.displayDesignation1}onKeyPress={this.onKeyPress} />)}
        </Form.Item>
))}
        </div>
        {this.state.publisherContactDetails.length>1 ? 
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
        {this.state.contactperson2.map(contactperson2 => (
  <Form.Item
          label={
            <span>
            Designation&nbsp;
          
            </span>
          }
        >
          {getFieldDecorator('designation2', {
             initialValue:contactperson2.designation,
            rules: [{pattern:/^[A-Za-z\s]+$/,message: 'Please input the designation!', whitespace: true }],
          })(<Input onChange={this.handleChange} id="designation2" name="designation2" disabled={this.state.displayDesignation2} />)}
        </Form.Item>
        ))}
        </div>
        : <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
        
  <Form.Item
          label={
            <span>
            Designation&nbsp;
          
            </span>
          }
        >
          {getFieldDecorator('designation2', {
            //  value:contactperson2[0].designation,
            rules: [{pattern:/^[A-Za-z\s]+$/,message: 'Please input the designation!', whitespace: true }],
          })(<Input onChange={this.handleChange} id="designation2" name="designation2" disabled={this.state.displayDesignation2} />)}
        </Form.Item>
        
        </div>}
 </div> 
 
{/* End of 2nd Row       */}

 <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
{this.state.contactperson1.map(contactperson1 => (
<Form.Item label={<span>E-mail&nbsp;
    <Tooltip title="As per registration">
        <Icon type="question-circle-o" />
    </Tooltip>
    </span>
    }
    >
          {getFieldDecorator('contactEmail1', {
             initialValue:contactperson1.email,
            rules: [
              {
                         //shivani - 3599 - changed RegEx as per validation requirement for hyphen .
                         //saurabh - 3745- changed RegEx, user should not be able to add social domain.
                pattern:/^\s*$|^[a-zA-Z0-9_%+]+[\w-]+[a-zA-Z0-9_%+]+(\.[a-zA-Z0-9]+)*@(?!gmail.com)(?!gmail.co.in)(?!yahoo.com)(?!yahoo.co.in)[a-zA-Z0-9]+[\w-]+[a-zA-Z0-9]+\.([a-zA-Z]{3,5}|[a-zA-z]{2,5}\.[a-zA-Z]{2,5})/,

                // pattern:  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+\.([a-zA-Z]{3,5}|[a-zA-z]{2,5}\.[a-zA-Z]{2,5})/,
                  message: 'Please input your E-mail !',
              },
              {
               // type: 'email',
                required: true,
                message: 'Please input your E-mail !',
              },
            ],
          })(<Input onChange={this.handleChange}  id="contactEmail1" name="contactEmail1" />)}
          <div style={{ fontSize: '14px', color: 'red',paddingLeft:'10px'}}>{this.state.newsuccess}</div>
        </Form.Item>
))}
        </div>
        {this.state.publisherContactDetails.length>1 ? 
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">
        {this.state.contactperson2.map(contactperson2 => (
        <Form.Item label={<span>E-mail&nbsp;
    <Tooltip title="As per registration">
        <Icon type="question-circle-o" />
    </Tooltip>
    </span>
    }
    >
          {getFieldDecorator('contactEmail2', {
             initialValue:contactperson2.email,
            rules: [
              {
                         //shivani - 3599 - changed RegEx as per validation requirement for hyphen .
                         //saurabh - 3745- changed RegEx, user should not be able to add social domain.
                           //Sandeep-task-3893-Production issue-Email format issue--All roles
                pattern:/^\s*$|^[\.a-zA-Z0-9_%+]+[\w-]+[a-zA-Z0-9_%+]+(\.[a-zA-Z0-9]+)*@(?!gmail.com)(?!gmail.co.in)(?!yahoo.com)(?!yahoo.co.in)[a-zA-Z0-9]+[\w-]+[a-zA-Z0-9]+\.([a-zA-Z]{3,5}|[a-zA-z]{2,5}\.[a-zA-Z]{2,5})/,

                // pattern:  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+\.([a-zA-Z]{3,5}|[a-zA-z]{2,5}\.[a-zA-Z]{2,5})/,
                message: 'The input is not valid E-mail!',
                
                           },
             
              {
               // type: 'email',
                //required: true,
                //message: 'Please input your E-mail!',
              },
            ],
          })(<Input onChange={this.handleChange}  id="contactEmail2" name="contactEmail2"onKeyPress={this.onKeyPress} />)}
        </Form.Item>
        ))}
        </div>
        :<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">
        
        <Form.Item label={<span>E-mail&nbsp;
    <Tooltip title="As per registration">
        <Icon type="question-circle-o" />
    </Tooltip>
    </span>
    }
    >
          {getFieldDecorator('contactEmail2', {
            
            rules: [
              {
                         //shivani - 3599 - changed RegEx as per validation requirement for hyphen .
                         //saurabh - 3745- changed RegEx, user should not be able to add social domain.
                           //Sandeep-task-3893-Production issue-Email format issue--All roles
                pattern:/^\s*$|^[\.a-zA-Z0-9_%+]+[\w-]+[a-zA-Z0-9_%+]+(\.[a-zA-Z0-9]+)*@(?!gmail.com)(?!gmail.co.in)(?!yahoo.com)(?!yahoo.co.in)[a-zA-Z0-9]+[\w-]+[a-zA-Z0-9]+\.([a-zA-Z]{3,5}|[a-zA-z]{2,5}\.[a-zA-Z]{2,5})/,

                // pattern:  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+\.([a-zA-Z]{3,5}|[a-zA-z]{2,5}\.[a-zA-Z]{2,5})/,
                message: 'The input is not valid E-mail!',
                
                           },
             
              {
               // type: 'email',
                //required: true,
                //message: 'Please input your E-mail!',
              },
            ],
          })(<Input onChange={this.handleChange}  id="contactEmail2" name="contactEmail2"onKeyPress={this.onKeyPress} />)}
        </Form.Item>
        
        </div>}
 </div>

{/* End of 2nd Row */}
       



<div class="row">
       <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
       {this.state.contactperson1.map(contactperson1 => (
       <Form.Item label={<span>Phone Number 1&nbsp;
       <Tooltip title="As per registration">
          <Icon type="question-circle-o" />
      </Tooltip>
      </span>
       }>
         {getFieldDecorator('phone1', {
            initialValue:contactperson1.phoneNo,
           rules :[{pattern:/^[0-9][0-9]{2,12}$/, required:true,message:"Please enter a valid Phone Number !"}]
         })(<Input  addonBefore={prefixSelector2} style={{ width: '100%' }} onChange={this.handleChange} id="phone1" name="phone1"  />)}
       </Form.Item>
       ))}
       <div class="errorMessage">{this.state.errors.PhoneCodeError}</div>
       </div>

       {this.state.publisherContactDetails.length>1 ? 
       <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
       {this.state.contactperson2.map(contactperson2 => (
       <Form.Item label={<span>Phone Number 2&nbsp;
       <Tooltip title="As per registration">
          <Icon type="question-circle-o" />
      </Tooltip>
      </span>
       }>
         {getFieldDecorator('phone2', {
            initialValue:contactperson2.phoneNo,
           rules: [{pattern:/^[0-9][0-9]{2,12}$/, message: 'Please enter a valid phone number !' }],
         })(<Input addonBefore={prefixSelector3} style={{ width: '100%' }} disabled={this.state.displayPhn2}  onChange={this.handleChange} id="phone2" name="phone2"   />)}
       </Form.Item>
       ))}
 
       </div>
        :<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        
        <Form.Item label={<span>Phone Number 2&nbsp;
        <Tooltip title="As per registration">
           <Icon type="question-circle-o" />
       </Tooltip>
       </span>
        }>
          {getFieldDecorator('phone2', {
             
            rules: [{pattern:/^[0-9][0-9]{2,12}$/, message: 'Please enter a valid phone number !' }],
          })(<Input addonBefore={prefixSelector3} style={{ width: '100%' }} disabled={this.state.displayPhn2}  onChange={this.handleChange} id="phone2" name="phone2"   />)}
        </Form.Item>
      
  
        </div>}
 </div> 

 <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6 captcha" >  
<Form.Item>
<ReCAPTCHA   class="captcha"
    ref={(el) => { this.recaptcha = el; }}
    sitekey="6Le_--AUAAAAAMTOIH8A2kj-qN1XB0uLkusHewHX"
    onChange={this.handleCaptchaResponseChange}/>
  <span class="errorMessage" style={{paddingLeft:'120px'}}>{this.state.errors.captchaResponse}</span>
      </Form.Item> 
      
      <Form.Item {...tailFormItemLayout}>
        {getFieldDecorator('agreement',         
         {
           valuePropName: 'checked',rules :[{validator:this.checkCheckBox}]
            })(
          <Checkbox>
            I have read the <a href="">agreement</a>
          </Checkbox>,
          )}
      </Form.Item>
      
        </div>
  
  </div>
  <div class="row" style={{float:"right"}}>
          <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"style={{paddingRight:"40px",paddingBottom:'20px'}}>
          <Form.Item {...tailFormItemLayout} >
          <button  type="primary" class="btn btn-primary" htmlType="submit" className={this.state.buttonDisplay}>
            Save and Next
          </button>
          {/*  */}
        </Form.Item> 
          </div>
        </div>




        {/* {/ End of 6th row /} */}

</Form>


  
</div>
<Footer/>
</div> 
// Final Div
     
    );
  }
}

/**
       * @author Narendra Phadke
       * @param  Description handle the login authentication
       * @return Description return All details of authentication
       */
      PublisherCompanyInformationEdit.propTypes = {
        logoutUser: PropTypes.func.isRequired,
        auth: PropTypes.object.isRequired
    }

    const mapStateToProps = (state) => ({
        auth: state.auth
    })
    const publisherRegistrationForm1 = Form.create({ name: 'register' })(PublisherCompanyInformationEdit);
export default connect(mapStateToProps, { logoutUser })(withRouter(publisherRegistrationForm1));
 

//export default publisherRegistrationForm1;
//ReactDOM.render(<WrappedRegistrationForm />, document.getElementById('container'));
          