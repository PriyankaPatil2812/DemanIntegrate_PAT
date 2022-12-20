/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/

/*@author Sandeep dhawale
*@fileName :
 *Desc: Publisher Bank details Edit tab
*/

import React from 'react';
import 'antd/dist/antd.css';
import { Form,Input, Button,Tooltip,Icon } from 'antd';
import Footer from "../layouts/footer";
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { logoutUser } from '../login/authentication';
import { withRouter } from 'react-router-dom';
import "./publisherBankDetailsEdit.css";
import {read_cookie, delete_cookie } from 'sfcookies';
import { json } from 'body-parser';

import { fetch_custom as fetch } from "../../configration/fetch_default_headers"; // Priyanka--3944--added default header


const cookie_key = 'publisherID';
const Swal = require('sweetalert2');
class PublisherBankDetailsEdit extends React.Component {
  state = { newsuccess:'',
  infoMsg:'',
  buttonDisplay:'disabled',
  displayBankName:'disabled',
  displayAccountNumber:'disabled',
  displayAccountHolder:'disabled',
  displayIFSCCode:'disabled',
  displayPAN:'disabled',
  displayGST:'disabled',
  publisherInfo:[],
  publisherInfo1:[{bankName:"",}]
};




  componentWillMount()
  {

       
       if(!this.props.auth.isAuthenticated) {
            this.props.history.push('/userLogin');
          }
          else{
        //  alert("Login Successful");
    
          //agencyDetails
          
          const {isAuthenticated, user} = this.props.auth;
          var pID=user.id;
          //let data={pID:user.id };  //Priyanka--3944--removed params
    
         this.setState({pID:pID})
    
            fetch("/publisher/publisherDetails",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
               // body:JSON.stringify(data)
            }).then(res=>res.json())
            .then(publisherInfo=>{
                this.setState({publisherInfo:publisherInfo})
            }).catch(function (err) {console.log(err)});


          }





  //  var pID=localStorage.getItem('pID');
  var pID= read_cookie(cookie_key)
   // alert("PublisherId from Local storage====>"+pID);
    if(pID=="")
    {
      this.setState({
        buttonDisplay: '',
        displayBankName:'',
        displayAccountNumber:'',
        displayAccountHolder:'',
        displayIFSCCode:'',
        displayPAN:'',
        displayGST:'',
        infoMsg:''
      });
    }
    else
    {
      this.setState({
        buttonDisplay: "button",
        displayBankName:'',
        displayAccountNumber:'',
        displayAccountHolder:'',
        displayIFSCCode:'',
        displayPAN:'',
        displayGST:'',
        infoMsg:''
      });
    }
  }

  handleSubmit = e => {
    e.preventDefault();
    var bankDetails=[...this.state.publisherInfo]
    //alert("bankDetails"+JSON.stringify(bankDetails))
    this.props.form.validateFieldsAndScroll((err, values) => 
    {
      if (!err) {
        // alert('Received values of form: '+ JSON.stringify(values));
        // console.log('Received values of form: ', values);
        // alert(JSON.stringify(values));
        //var pID=localStorage.getItem('pID');
        var pID= read_cookie(cookie_key);
        // alert(pID);
        let data={
          // userID:pID,
          // bankName:values.bankName,
          // accountNumber:values.accountNumber,
          // accountHolderName:values.accountholderName,
          // ifscCode:values.ifscCode,
          // panNumber:values.panNumber,
          // gstNumber:values.taxNumber          
           bankDetails:bankDetails
        }
        // alert("DAta :"+JSON.stringify(data));
        fetch("publisher/editPublisherBankInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(res=>res.json()).then(res=>{
         // alert("res data===="+JSON.stringify(res))
          console.warn("Response in res in=="+JSON.stringify(res));
            if(res.success==true)
            {
              var a=(res.message);
              // alert(a)
              Swal.fire({
                type:'success',
                text:'Bank details edited successfully !',
                preConfirm: () => {
                  window.location.reload();
                }
              })
            
              // this.setState({newsuccess:a});
              this.setState({
                buttonDisplay:'disabled'});
             }
             delete_cookie('publisherID');
            }).catch(function (err) {
          console.log(err)
        });
      }
      else
      {
          //alert("Please fill the form");
      }
    });
  };

 



  handleChange=e => {
    const {isAuthenticated, user} = this.props.auth;
    const{name,value}=e.target
 if(name=="bankName")
 {
 // alert("in handle change"+JSON.stringify(this.state.publisherInfo))
   let publisherInfo=[...this.state.publisherInfo]
  // alert("pubinfo==="+JSON.stringify(publisherInfo))
   publisherInfo[0] = { ...publisherInfo[0], ["bankName"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }

 if(name=="accountNumber")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["accountNumber"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }

 if(name=="accountholderName")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["accountHolderName"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }

 if(name=="ifscCode")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["ifscCode"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }
 if(name=="panNumber")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["panNumber"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }
 if(name=="taxNumber")
 {
   let publisherInfo=[...this.state.publisherInfo]
   publisherInfo[0] = { ...publisherInfo[0], ["gstNumber"]: value };
   this.state.publisherInfo=[...publisherInfo];
   this.setState({publisherInfo1:publisherInfo},function(){console.log(this.state.publisherInfo)})
 }



    // let fields = this.state;
    // fields[e.target.name] = e.target.value;
    // this.setState({
    //   fields
    // });
   // alert("Value====>"+this.state.companyName);
    
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    

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
  

  

    return (
      <div>
      
      <div class="container-fluid">
      <br/><br/>
      <div style={{ fontSize: '22px', color: 'green',paddingLeft:'490px'}}>{this.state.newsuccess}</div>
      <div style={{ fontSize: '16px', color: '#1890ff',paddingLeft:'490px'}}>{this.state.infoMsg}</div>
          <br/>

  <Form {...formItemLayout} onSubmit={this.handleSubmit}>
<div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
{this.state.publisherInfo.map(publisherInfo => (   
  <Form.Item
          label={
            <span>
            Bank Name&nbsp;
              {/* <Tooltip title="As per registration">
                <Icon type="question-circle-o" />
              </Tooltip> */}
            </span>
          }
        >
          {getFieldDecorator('bankName', {
            initialValue:publisherInfo.bankName,
            rules: [{ pattern:/^[A-Za-z\s]+$/,required: true, message: 'Please input your bank name!', whitespace: true }],
          })(<Input  onChange={this.handleChange} id="bankName" name="bankName"  disabled={this.state.displayBankName}/>)}
        </Form.Item>
))}
        </div>
 
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">
        {this.state.publisherInfo.map(publisherInfo => (   
        <Form.Item
          label={
            <span>
            Account Number&nbsp;
              {/* <Tooltip title="As per registration">
                <Icon type="question-circle-o" />
              </Tooltip> */}
            </span>
          }
        >
          {getFieldDecorator('accountNumber', {
            initialValue:publisherInfo.accountNumber,
            rules: [{ pattern:/^[0-9]*$/, required: true, message: 'Please input your valid account number!', whitespace: true }],
          })(<Input  onChange={this.handleChange} id="accountNumber" name="accountNumber" disabled={this.state.displayAccountNumber}/>)}
        </Form.Item>
        ))}
        </div>
 </div>  
 {/* End of 1st Row */}

 <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
{this.state.publisherInfo.map(publisherInfo => (  
<Form.Item
          label={
            <span >
            Accountholder Name&nbsp;
              {/* <Tooltip title="As per registration">
                <Icon type="question-circle-o" />
              </Tooltip> */}
            </span>
          }
        >
          {getFieldDecorator('accountholderName', {
            initialValue:publisherInfo.accountHolderName,
            rules: [{ pattern:/^[A-Za-z\s]+$/,required: true, message: 'Please input your accountholder name!', whitespace: true }],
          })(<Input  onChange={this.handleChange} id="accountholderName" name="accountholderName" disabled={this.state.displayAccountHolder}/>)}
        </Form.Item>
))}
        </div>
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
        {this.state.publisherInfo.map(publisherInfo => (  
<Form.Item
          label={
            <span>
            IFSC Code&nbsp;
              <Tooltip title="Example -BKID0000660">
                <Icon type="question-circle-o" />
              </Tooltip>
            </span>
          }
        >
          {getFieldDecorator('ifscCode', {
            initialValue:publisherInfo.ifscCode,
            rules: [{ pattern:/^[A-Za-z]{4}[a-zA-Z0-9]{7}$/,required: true, message: 'Please input your IFSC Code!', whitespace: true }],
          })(<Input  onChange={this.handleChange} id="ifscCode" name="ifscCode" disabled={this.state.displayIFSCCode}/>)}
        </Form.Item>
        ))}
        </div>
 
       
 </div>
{/* End of 2nd Row */}


 <div class="row">

<div class="col-xs-12  col-sm-12 col-md-6 col-lg-6"> 
{this.state.publisherInfo.map(publisherInfo => (  
<Form.Item label={<span>PAN/TAN Number&nbsp;
  <Tooltip title="Example:PAN:AAAPL1234C&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;TAN: RXOY 02811 K">
          <Icon type="question-circle-o" />
  </Tooltip>

</span>
}>
          {getFieldDecorator('panNumber', {
            initialValue:publisherInfo.panNumber,
             rules: [{pattern:/[A-Za-z]{5}\d{4}[A-Za-z]{1}/, required: true, message: 'Please input your PAN/TAN Number!' }],
          })(<Input style={{ width: '100%' }} onChange={this.handleChange} id="panNumber" name="panNumber" disabled={this.state.displayPAN} />)}
        </Form.Item>
))}
        </div>
 
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        {this.state.publisherInfo.map(publisherInfo => ( 
        <Form.Item label={<span>TAX/GST Number&nbsp;
        <Tooltip title="Example- TAX :XXX-XX-XXXX   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; GST: 22 AAAAA0000A 1 Z 5">
                  <Icon type="question-circle-o" />
       </Tooltip>
       </span>
        }
        >
          {getFieldDecorator('taxNumber', {
            initialValue:publisherInfo.gstNumber,
            rules: [{pattern:/^([0]{1}[1-9]{1}|[1-2]{1}[0-9]{1}|[3]{1}[0-7]{1})([a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9a-zA-Z]{1}[zZ]{1}[0-9a-zA-Z]{1})+$/, required: true, message: 'Please input TAX/GST Number!' }],
          })(<Input onChange={this.handleChange} id="taxNumber" name="taxNumber" disabled={this.state.displayGST} />)}
        </Form.Item>
        ))}
        </div>
 </div> 
{/* End of 3rd Row       */}
       

      
<div class="row">
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">  
        </div>
        <div class="col-xs-12  col-sm-12 col-md-6 col-lg-6">
          <Form.Item {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit" className={this.state.buttonDisplay} style={{marginBottom:'60px'}}>
            Save 
          </Button>
        </Form.Item> 
          </div>
        </div>

        {/* End of 4th row */}


        
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
      PublisherBankDetailsEdit.propTypes = {
        logoutUser: PropTypes.func.isRequired,
        auth: PropTypes.object.isRequired
    }

    const  mapStateToProps = (state) => ({
        auth: state.auth
    })
const publisherRegistrationForm4 = Form.create({ name: 'register' })(PublisherBankDetailsEdit);
export default connect(mapStateToProps, { logoutUser })(withRouter(publisherRegistrationForm4));
//export default publisherRegistrationForm4;

          