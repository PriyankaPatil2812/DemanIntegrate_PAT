/* Copyright(c) 2019 APSS Media Pvt. Ltd.
 *  All Rights Reserved
 */

/*
@author:Nikita
@Description:Email Config
date: 18-12-2019 
*/

import React, { Component } from "react";
import {
	Form,
	Input,
	button,
	Card,
	Icon,
	Tooltip,
	Table,
	Checkbox,
	Row,
	Col,
} from "antd";
import { connect } from "react-redux";
import Navigation from "../layouts/publisherNavPage";
import PropTypes from "prop-types";
import Footer from "../layouts/footer";
import { css } from "emotion";
import { logoutUser } from "../login/authentication";
import { withRouter } from "react-router-dom";
import { fetch_custom as fetch } from "../../configration/fetch_default_headers"; // karan-task-3723-vapt header and query params
const Swal = require("sweetalert2");

const campActivity = [
	{ id: "Campaign Allocation", name: "campaignAllocation", value: "No" },
	{ id: "Edit Campaign", name: "editCampaign", value: "No" },
	{ id: "Accept Campaign", name: "acceptCampaign", value: "No" },
	{ id: "Pause Campaign", name: "pauseCampaign", value: "No" },
	{ id: "Resume Campaign", name: "resumeCampaign", value: "No" },
	{ id: "Complete Campaign", name: "completeCampaign", value: "No" },
	{ id: "Reject Campaign", name: "rejectCampaign", value: "No" },
	{ id: "Counter Campaign", name: "counterCampaign", value: "No" },
	{ id: "Counter Accept Campaign", name: "counterAcceptCampaign", value: "No" },
	{ id: "Counter Reject Campaign", name: "counterRejectCampaign", value: "No" },
	// { id: 'Active Campaign', name: 'activeCampaign', value: 'No' },
	{ id: "Bidding Allocation", name: "biddingAllocation", value: "No" },
	{ id: "Bidding Submission", name: "biddingSubmission", value: "No" },
	{ id: "Bidding Review", name: "biddingReview", value: "No" },
	{ id: "Pacing Alert", name: "pacingAlert", value: "No" },
];

const leadActivity = [
	{ id: "Lead Upload", name: "leadUpload", value: "No" },
	{ id: "Lead Review", name: "leadReview", value: "No" },
	{ id: "Leads Decrement", name: "leadsDecrement", value: "No" },
	{ id: "Update Leads Permission", name: "updateLeadsPermission", value: "No" },
	// { id: 'Voice Link Upload', name: 'voiceLinkUpload', value: 'No' },
	// { id: 'TDR Report', name: 'tdrReport', value: 'No' },
];

const pubActivity = [
	// { id: 'Cancel Publisher', name: 'cancelPublisher', value: 'No' },
	{ id: "End Date Publisher", name: "endDatePublisher", value: "No" },
	// { id: 'Re-Allocation Campaign', name: 'reAllocationCampaign', value: 'No' },
	{ id: "Landing Page Submit", name: "landingPageSubmit", value: "No" },
	{ id: "CS Submit", name: "csSubmit", value: "No" },
	{ id: "POC Submit", name: "pocSubmit", value: "No" },
	{ id: "Creative Review", name: "creativeReview", value: "No" },
];

const deadline = [
	{
		id: "First Delivery Date Warn",
		name: "firstDeliveryDateWarn",
		value: "No",
	},
	{
		id: "First Delivery Date Cross",
		name: "firstDeliveryDateCross",
		value: "No",
	},
	{ id: "Accept Campaign Warn", name: "acceptCampaignWarn", value: "No" },
	{ id: "Creatives Upload Warn", name: "creativesUploadWarn", value: "No" },
	{ id: "TDR Report", name: "tdrReport", value: "No" },
	// { id: 'Pacing Alert', name: 'pacingAlert', value: 'No' },
	// { id: 'RFP Acknowledgement', name: 'rfpAcknowledgement', value: 'No' },
];
const others = [
	{ id: "Daily Update", name: "dailyUpdate", value: "No" },
	{ id: "Link Agency Publisher", name: "linkAgencyPublisher", value: "No" },
	{ id: "New Message", name: "message", value: "No" },
	// { id: 'Add User', name: 'addUser', value: 'No' },
	{ id: "Invoice Reviewed", name: "invoiceReviewed", value: "No" },
	{
		id: "Invoice Reviewed Deadline Alert",
		name: "invoiceReviewAlert",
		value: "No",
	},
];

const campPlain = campActivity.map(function (a) {
	return a.name;
});
const pubPlain = pubActivity.map(function (a) {
	return a.name;
});
const leadPlain = leadActivity.map(function (a) {
	return a.name;
});
const deadlinePlain = deadline.map(function (a) {
	return a.name;
});
const otherPlain = others.map(function (a) {
	return a.name;
});

const campActivityForNC = [
	{ id: "Edit Campaign", name: "editCampaign", value: "No" },
	{ id: "Pause Campaign", name: "pauseCampaign", value: "No" },
	{ id: "Resume Campaign", name: "resumeCampaign", value: "No" },
	{ id: "Complete Campaign", name: "completeCampaign", value: "No" },
];

// const leadActivityForNC = [
//   { id: 'Lead Review', name: 'leadReview', value: 'No' },
//   { id: 'Update Leads Permission', name: 'updateLeadsPermission', value: 'No' },
//   { id: 'Voice Link Upload', name: 'voiceLinkUpload', value: 'No' },
//   { id: 'TDR Report', name: 'tdrReport', value: 'No' },

// ];

const pubActivityForNC = [
	// { id: 'End Date Publisher', name: 'endDatePublisher', value: 'No' },
	{ id: "Creative Review", name: "creativeReview", value: "No" },
];

const deadlineForNC = [
	{
		id: "First Delivery Date Cross",
		name: "firstDeliveryDateCross",
		value: "No",
	},
	{
		id: "First Delivery Date Warn",
		name: "firstDeliveryDateWarn",
		value: "No",
	},
	// { id: 'Accept Campaign Warn', name: 'acceptCampaignWarn', value: 'No' },
	{ id: "Creatives Upload Warn", name: "creativesUploadWarn", value: "No" },
	// { id: 'Pacing Alert', name: 'pacingAlert', value: 'No' },
	// { id: 'RFP Acknowledgement', name: 'rfpAcknowledgement', value: 'No' },
];
const othersForNC = [
	// { id: 'Daily Update', name: 'dailyUpdate', value: 'No' },
	{ id: "Link Agency Publisher", name: "linkAgencyPublisher", value: "No" },
	{ id: "New Message", name: "message", value: "No" },
	// { id: 'Add User', name: 'addUser', value: 'No' },
	// { id: 'Invoice Reviewed', name: 'invoiceReviewed', value: 'No' },
];

const leadActivityForQA = [
	// { id: 'Lead Upload', name: 'leadUpload', value: 'No' },
	{ id: "Lead Review", name: "leadReview", value: "No" },
	// { id: 'Leads Decrement', name: 'leadsDecrement', value: 'No' },
	{ id: "Update Leads Permission", name: "updateLeadsPermission", value: "No" },
	// { id: 'Voice Link Upload', name: 'voiceLinkUpload', value: 'No' },
	// { id: 'TDR Report', name: 'tdrReport', value: 'No' },
];

const pubActivityForQA = [
	// { id: 'Cancel Publisher', name: 'cancelPublisher', value: 'No' },
	// { id: 'End Date Publisher', name: 'endDatePublisher', value: 'No' },
	// { id: 'Re-Allocation Campaign', name: 'reAllocationCampaign', value: 'No' },
	// { id: 'Landing Page Submit', name: 'landingPageSubmit', value: 'No' },
	// { id: 'CS Submit', name: 'csSubmit', value: 'No' },
	// { id: 'POC Submit', name: 'pocSubmit', value: 'No' },
	{ id: "Creative Review", name: "creativeReview", value: "No" },
];
const otherPlainNC = othersForNC.map(function (a) {
	return a.name;
});

const campPlainForNC = campActivityForNC.map(function (a) {
	return a.name;
});
const deadlinePlainNC = deadlineForNC.map(function (a) {
	return a.name;
});

// const campData = resultCamp.map(function (a) { return a.name });
// const pubData = resultPub.map(function (a) { return a.name });
// const leadData = resultLead.map(function (a) { return a.name });
// const deadlineData = resultDeadline.map(function (a) { return a.name });
// const otherData = resultOther.map(function (a) { return a.name });
//var data1=JSON.stringify(data)

// const defaultCampChecked = campData;
// const defaultPubChecked = pubData;
// const defaultLeadChecked = leadData;
// const defaultDeadlineChecked = deadlineData;
// const defaultOthersChecked = otherData;

class PublisherEmailConfig extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			// campCheckedList: defaultCampChecked,
			// pubCheckedList: defaultPubChecked,
			// leadCheckedList: defaultLeadChecked,
			// deadlineCheckedList: defaultDeadlineChecked,
			// othersCheckedList: defaultOthersChecked,

			// campCheckedList,
			// pubCheckedList,
			// leadCheckedList,
			// deadlineCheckedList,
			// othersCheckedList,

			campIndeterminate: true,
			pubIndeterminate: true,
			leadIndeterminate: true,
			deadlineIndeterminate: true,
			othersIndeterminate: true,

			campIndeterminateForNC: true,
			campIndeterminateForNC: true,
			pubIndeterminateForNC: true,
			leadIndeterminateForNC: true,
			deadlineIndeterminateForNC: true,
			othersIndeterminateForNC: true,

			pubIndeterminateForQA: true,
			leadIndeterminateForQA: true,

			campCheckAll: false,
			pubCheckAll: false,
			leadCheckAll: false,
			deadlineCheckAll: false,
			othersCheckAll: false,
			emailConfigData: [],
			role: "",
		};
	}

	// campCheckedList
	campOnChange = (campCheckedList) => {
		this.setState({
			campCheckedList,
			campIndeterminate:
				!!campCheckedList.length &&
				campCheckedList.length < campActivity.length,
			campCheckAll: campCheckedList.length === campActivity.length,
		});
	};

	campOnChangeForNC = (campCheckedListForNC) => {
		this.setState({
			campCheckedListForNC,
			campIndeterminateForNC:
				!!campCheckedListForNC.length &&
				campCheckedListForNC.length < campActivityForNC.length,
			campCheckAll: campCheckedListForNC.length === campActivityForNC.length,
		});
	};

	campOnCheckAllChange = (e) => {
		this.setState({
			campCheckedList: e.target.checked ? campPlain : [],
			campCheckedListForNC: e.target.checked ? campPlainForNC : [],

			campIndeterminate: false,
			campIndeterminateForNC: false,
			campCheckAll: e.target.checked,
		});
	};

	// pubCheckedList
	pubOnChange = (pubCheckedList) => {
		this.setState({
			pubCheckedList,
			pubIndeterminate:
				!!pubCheckedList.length && pubCheckedList.length < pubActivity.length,
			pubCheckAll: pubCheckedList.length === pubActivity.length,
		});
	};

	pubOnCheckAllChange = (e) => {
		this.setState({
			pubCheckedList: e.target.checked ? pubPlain : [],
			pubIndeterminate: false,
			// pubCheckedListForNC: e.target.checked ? pubPlainNC : [],
			// pubIndeterminateForNC: false,
			pubCheckAll: e.target.checked,
		});
	};

	pubOnChangeForNC = (pubCheckedListForNC) => {
		this.setState({
			pubCheckedListForNC,
			pubIndeterminateForNC:
				!!pubCheckedListForNC.length &&
				pubCheckedListForNC.length < pubActivityForNC.length,
			pubCheckAll: pubCheckedListForNC.length === pubActivityForNC.length,
		});
	};

	pubOnChangeForQA = (pubCheckedListForQA) => {
		this.setState({
			pubCheckedListForQA,
			pubIndeterminateForQA:
				!!pubCheckedListForQA.length &&
				pubCheckedListForQA.length < pubActivityForQA.length,
			pubCheckAll: pubCheckedListForQA.length === pubActivityForQA.length,
		});
	};

	// leadCheckedList
	leadOnChange = (leadCheckedList) => {
		this.setState({
			leadCheckedList,
			leadIndeterminate:
				!!leadCheckedList.length &&
				leadCheckedList.length < leadActivity.length,
			leadCheckAll: leadCheckedList.length === leadActivity.length,
		});
	};

	leadOnCheckAllChange = (e) => {
		this.setState({
			leadCheckedList: e.target.checked ? leadPlain : [],
			leadCheckedListForQA: e.target.checked ? leadPlain : [],
			leadIndeterminate: false,
			leadIndeterminateForQA: false,
			leadCheckAll: e.target.checked,
		});
	};

	leadOnChangeForQA = (leadCheckedListForQA) => {
		this.setState({
			leadCheckedListForQA,
			leadIndeterminateForQA:
				!!leadCheckedListForQA.length &&
				leadCheckedListForQA.length < leadActivityForQA.length,
			leadCheckAll: leadCheckedListForQA.length === leadActivityForQA.length,
		});
	};

	// leadOnCheckAllChange = e => {
	//   this.setState({
	//     leadCheckedList: e.target.checked ? leadPlain : [],
	//     leadIndeterminate: false,
	//     leadCheckAll: e.target.checked,
	//   });
	// };

	// deadlineCheckedList
	deadlineOnChange = (deadlineCheckedList) => {
		this.setState({
			deadlineCheckedList,
			deadlineIndeterminate:
				!!deadlineCheckedList.length &&
				deadlineCheckedList.length < deadline.length,
			deadlineCheckAll: deadlineCheckedList.length === deadline.length,
		});
	};

	deadlineOnCheckAllChange = (e) => {
		this.setState({
			deadlineCheckedList: e.target.checked ? deadlinePlain : [],
			deadlineIndeterminate: false,
			deadlineCheckedListForNC: e.target.checked ? deadlinePlainNC : [],
			deadlineIndeterminateForNC: false,
			deadlineCheckAll: e.target.checked,
		});
	};

	deadlineOnChangeForNC = (deadlineCheckedListForNC) => {
		this.setState({
			deadlineCheckedListForNC,
			deadlineIndeterminateForNC:
				!!deadlineCheckedListForNC.length &&
				deadlineCheckedListForNC.length < deadlineForNC.length,
			deadlineCheckAll:
				deadlineCheckedListForNC.length === deadlineForNC.length,
		});
	};

	// othersCheckedList
	othersOnChange = (othersCheckedList) => {
		this.setState({
			othersCheckedList,
			othersIndeterminate:
				!!othersCheckedList.length && othersCheckedList.length < others.length,
			othersCheckAll: othersCheckedList.length === others.length,
		});
	};

	othersOnCheckAllChange = (e) => {
		this.setState({
			othersCheckedList: e.target.checked ? otherPlain : [],
			othersIndeterminate: false,
			othersCheckedListForNC: e.target.checked ? otherPlainNC : [],
			othersIndeterminateForNC: false,
			othersCheckAll: e.target.checked,
		});
	};

	othersOnChangeForNC = (othersCheckedListForNC) => {
		this.setState({
			othersCheckedListForNC,
			othersIndeterminateForNC:
				!!othersCheckedListForNC.length &&
				othersCheckedListForNC.length < othersForNC.length,
			othersCheckAll: othersCheckedListForNC.length === othersForNC.length,
		});
	};

	handleSubmit = (e) => {
		//camp
		e.preventDefault();

		var finalCampCheckedList = [];
		var data = {};
		var dataForNC = {};
		var dataForQA = {};
		var campCheckedList = this.state.campCheckedList;
		var result2 = campActivity.filter(function (b) {
			var name = b.name.toString();
			return !campCheckedList.includes(name);
		});

		for (var i = 0; i < this.state.campCheckedList.length; i++) {
			var temp = this.state.campCheckedList[i];
			data[temp] = "Yes";
		}

		for (var i = 0; i < result2.length; i++) {
			var temp = result2[i].name;
			data[temp] = "No";
		}

		//Added by Sonali for PC
		var campCheckedListForNC = this.state.campCheckedListForNC;
		var result2ForNC = campActivityForNC.filter(function (b) {
			var name = b.name.toString();
			return !campCheckedListForNC.includes(name);
		});

		for (var i = 0; i < this.state.campCheckedListForNC.length; i++) {
			var temp = this.state.campCheckedListForNC[i];
			dataForNC[temp] = "Yes";
		}

		for (var i = 0; i < result2ForNC.length; i++) {
			var temp = result2ForNC[i].name;
			dataForNC[temp] = "No";
		}

		//pub
		var pubCheckedList = this.state.pubCheckedList;
		var result2 = pubActivity.filter(function (b) {
			var name = b.name.toString();
			return !pubCheckedList.includes(name);
		});

		for (var i = 0; i < this.state.pubCheckedList.length; i++) {
			var temp = this.state.pubCheckedList[i];
			data[temp] = "Yes";
		}

		for (var i = 0; i < result2.length; i++) {
			var temp = result2[i].name;
			data[temp] = "No";
		}

		//Added by Sonali for PC
		var pubCheckedListForNC = this.state.pubCheckedListForNC;
		var result2ForNC = pubActivityForNC.filter(function (b) {
			var name = b.name.toString();
			return !pubCheckedListForNC.includes(name);
		});

		for (var i = 0; i < this.state.pubCheckedListForNC.length; i++) {
			var temp = this.state.pubCheckedListForNC[i];
			dataForNC[temp] = "Yes";
		}

		for (var i = 0; i < result2ForNC.length; i++) {
			var temp = result2ForNC[i].name;
			dataForNC[temp] = "No";
		}

		var pubCheckedListForQA = this.state.pubCheckedListForQA;
		var result2ForQA = pubActivityForQA.filter(function (b) {
			var name = b.name.toString();
			return !pubCheckedListForQA.includes(name);
		});

		for (var i = 0; i < this.state.pubCheckedListForQA.length; i++) {
			var temp = this.state.pubCheckedListForQA[i];
			dataForQA[temp] = "Yes";
		}

		for (var i = 0; i < result2ForQA.length; i++) {
			var temp = result2ForQA[i].name;
			dataForQA[temp] = "No";
		}

		var leadCheckedList = this.state.leadCheckedList;
		var result2 = leadActivity.filter(function (b) {
			var name = b.name.toString();
			return !leadCheckedList.includes(name);
		});

		for (var i = 0; i < this.state.leadCheckedList.length; i++) {
			var temp = this.state.leadCheckedList[i];
			data[temp] = "Yes";
		}

		for (var i = 0; i < result2.length; i++) {
			var temp = result2[i].name;
			data[temp] = "No";
		}

		//Added by Sonali for PC

		var leadCheckedListForQA = this.state.leadCheckedListForQA;
		var result2ForQA = leadActivityForQA.filter(function (b) {
			var name = b.name.toString();
			return !leadCheckedListForQA.includes(name);
		});

		for (var i = 0; i < this.state.leadCheckedListForQA.length; i++) {
			var temp = this.state.leadCheckedListForQA[i];
			dataForQA[temp] = "Yes";
		}

		for (var i = 0; i < result2ForQA.length; i++) {
			var temp = result2ForQA[i].name;
			dataForQA[temp] = "No";
		}

		//deadline
		var deadlineCheckedList = this.state.deadlineCheckedList;
		var result2 = deadline.filter(function (b) {
			var name = b.name.toString();
			return !deadlineCheckedList.includes(name);
		});

		for (var i = 0; i < this.state.deadlineCheckedList.length; i++) {
			var temp = this.state.deadlineCheckedList[i];
			data[temp] = "Yes";
		}

		for (var i = 0; i < result2.length; i++) {
			var temp = result2[i].name;
			data[temp] = "No";
		}

		//Added by Sonali for PC

		var deadlineCheckedListForNC = this.state.deadlineCheckedListForNC;
		var result2ForNC = deadlineForNC.filter(function (b) {
			var name = b.name.toString();
			return !deadlineCheckedListForNC.includes(name);
		});

		for (var i = 0; i < this.state.deadlineCheckedListForNC.length; i++) {
			var temp = this.state.deadlineCheckedListForNC[i];
			dataForNC[temp] = "Yes";
		}

		for (var i = 0; i < result2ForNC.length; i++) {
			var temp = result2ForNC[i].name;
			dataForNC[temp] = "No";
		}

		//other
		var othersCheckedList = this.state.othersCheckedList;
		var result2 = others.filter(function (b) {
			var name = b.name.toString();
			return !othersCheckedList.includes(name);
		});

		for (var i = 0; i < this.state.othersCheckedList.length; i++) {
			var temp = this.state.othersCheckedList[i];
			data[temp] = "Yes";
		}

		for (var i = 0; i < result2.length; i++) {
			var temp = result2[i].name;
			data[temp] = "No";
		}

		//Added by sonali for PC
		var othersCheckedListForNC = this.state.othersCheckedListForNC;
		var result2ForNC = othersForNC.filter(function (b) {
			var name = b.name.toString();
			return !othersCheckedListForNC.includes(name);
		});

		for (var i = 0; i < this.state.othersCheckedListForNC.length; i++) {
			var temp = this.state.othersCheckedListForNC[i];
			dataForNC[temp] = "Yes";
		}

		for (var i = 0; i < result2ForNC.length; i++) {
			var temp = result2ForNC[i].name;
			dataForNC[temp] = "No";
		}

		if (this.state.role === "PC") {
			finalCampCheckedList.push(data);
		} else if (this.state.role === "PNC") {
			finalCampCheckedList.push(dataForNC);
		} else {
			finalCampCheckedList.push(dataForQA);
		}

		// alert("finalCampCheckedList===" + JSON.stringify(finalCampCheckedList))
		const { user } = this.props.auth;

		let configData = {
			activity: finalCampCheckedList,
		}; // karan-task-3723-vapt header and query params
		fetch("/userConfiguration/emailConfigurationInfo", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(configData),
		})
			.then((res) => res.json())
			.then((response) => {
				Swal.fire({
					text: "Email Configuration Done Successfully",
					type: "success",
					confirmButtonText: "Ok",
					allowOutsideClick: false,
					preConfirm: () => {
						window.location.reload();
					},
				});
			});
	};

	componentWillMount() {
		if (!this.props.auth.isAuthenticated) {
			this.props.history.push("/userLogin");
		} else {
			const { user } = this.props.auth;
			this.setState({ role: user.role });

			fetch("/userConfiguration/getEmailConfigurationInfo", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}) // karan-task-3723-vapt header and query params
				.then((res) => res.json())
				.then((emailConfigData) => {
					this.setState({ emailConfigData: emailConfigData });

					var tempArray = [];
					var temp = this.state.emailConfigData.filter(function (obj) {
						let keys = Object.keys(obj);
						let values = keys.map(function (key) {
							var a = obj[key];
							if (a == "Yes") {
								tempArray.push(key);
							}
						});
					});
					var resultCamp = campActivity.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultPub = pubActivity.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultLead = leadActivity.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultDeadline = deadline.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultOther = others.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultCampForNC = campActivityForNC.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultPubForNC = pubActivityForNC.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultPubForQA = pubActivityForQA.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultLeadForQA = leadActivityForQA.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultDeadlineForNC = deadlineForNC.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					var resultOtherForNC = othersForNC.filter(function (b) {
						var name = b.name.toString();
						return tempArray.includes(name);
					});

					const campData = resultCamp.map(function (a) {
						return a.name;
					});
					const pubData = resultPub.map(function (a) {
						return a.name;
					});
					const leadData = resultLead.map(function (a) {
						return a.name;
					});
					const deadlineData = resultDeadline.map(function (a) {
						return a.name;
					});
					const otherData = resultOther.map(function (a) {
						return a.name;
					});

					const campDataForNC = resultCampForNC.map(function (a) {
						return a.name;
					});
					const pubDataForNC = resultPubForNC.map(function (a) {
						return a.name;
					});
					// const leadDataForNC = resultLeadForNC.map(function (a) { return a.name });
					const deadlineDataForNC = resultDeadlineForNC.map(function (a) {
						return a.name;
					});
					const otherDataForNC = resultOtherForNC.map(function (a) {
						return a.name;
					});

					const pubDataForQA = resultPubForQA.map(function (a) {
						return a.name;
					});
					const leadDataForQA = resultLeadForQA.map(function (a) {
						return a.name;
					});

					this.setState({
						campCheckedList: campData,
						pubCheckedList: pubData,
						leadCheckedList: leadData,
						deadlineCheckedList: deadlineData,
						othersCheckedList: otherData,

						campCheckedListForNC: campDataForNC,
						pubCheckedListForNC: pubDataForNC,
						// leadCheckedListForNC: leadDataForNC,
						deadlineCheckedListForNC: deadlineDataForNC,
						othersCheckedListForNC: otherDataForNC,

						pubCheckedListForQA: pubDataForQA,
						leadCheckedListForQA: leadDataForQA,
					});

					if (
						this.state.emailConfigData &&
						this.state.emailConfigData.length > 0
					) {
						for (var i = 0; i < this.state.emailConfigData.length; i++) {
							if (this.state.role === "PC") {
								if (
									this.state.emailConfigData[i].campaignAllocation === "Yes" &&
									this.state.emailConfigData[i].editCampaign === "Yes" &&
									this.state.emailConfigData[i].acceptCampaign === "Yes" &&
									this.state.emailConfigData[i].pauseCampaign === "Yes" &&
									this.state.emailConfigData[i].resumeCampaign === "Yes" &&
									this.state.emailConfigData[i].completeCampaign === "Yes" &&
									this.state.emailConfigData[i].rejectCampaign === "Yes" &&
									this.state.emailConfigData[i].counterCampaign === "Yes" &&
									this.state.emailConfigData[i].counterAcceptCampaign ===
										"Yes" &&
									this.state.emailConfigData[i].counterRejectCampaign ===
										"Yes" &&
									this.state.emailConfigData[i].biddingAllocation === "Yes" &&
									this.state.emailConfigData[i].biddingSubmission === "Yes" &&
									this.state.emailConfigData[i].biddingReview === "Yes"
								) {
									this.setState({ campCheckAll: true });
								}
							} else {
								if (
									this.state.emailConfigData[i].editCampaign === "Yes" &&
									this.state.emailConfigData[i].pauseCampaign === "Yes" &&
									this.state.emailConfigData[i].resumeCampaign === "Yes" &&
									this.state.emailConfigData[i].completeCampaign === "Yes"
								) {
									this.setState({ campCheckAll: true });
								}
							}

							if (this.state.role === "PC") {
								if (
									this.state.emailConfigData[i].endDatePublisher === "Yes" &&
									this.state.emailConfigData[i].landingPageSubmit === "Yes" &&
									this.state.emailConfigData[i].csSubmit === "Yes" &&
									this.state.emailConfigData[i].pocSubmit === "Yes" &&
									this.state.emailConfigData[i].creativeReview === "Yes"
								) {
									this.setState({ pubCheckAll: true });
								}
							} else {
								if (this.state.emailConfigData[i].creativeReview === "Yes") {
									this.setState({ pubCheckAll: true });
								}
							}

							if (this.state.role === "PC") {
								if (
									this.state.emailConfigData[i].leadUpload === "Yes" &&
									this.state.emailConfigData[i].leadReview === "Yes" &&
									this.state.emailConfigData[i].leadsDecrement === "Yes" &&
									this.state.emailConfigData[i].updateLeadsPermission === "Yes"
								) {
									this.setState({ leadCheckAll: true });
								}
							} else if (this.state.role === "PQA") {
								if (
									this.state.emailConfigData[i].leadReview === "Yes" &&
									this.state.emailConfigData[i].updateLeadsPermission === "Yes"
								) {
									this.setState({ leadCheckAll: true });
								}
							} else {
								// if(
								//   this.state.emailConfigData[i].leadUpload==="Yes"&&
								//   this.state.emailConfigData[i].leadReview==="Yes"&&
								//   this.state.emailConfigData[i].leadsDecrement==="Yes"&&
								//   this.state.emailConfigData[i].updateLeadsPermission==="Yes"
								//   ){this.setState({leadCheckAll:true})}
							}

							if (this.state.role === "PC") {
								if (
									this.state.emailConfigData[i].firstDeliveryDateWarn ===
										"Yes" &&
									this.state.emailConfigData[i].firstDeliveryDateCross ===
										"Yes" &&
									this.state.emailConfigData[i].tdrReport === "Yes" &&
									this.state.emailConfigData[i].acceptCampaignWarn === "Yes" &&
									this.state.emailConfigData[i].creativesUploadWarn === "Yes"
								) {
									this.setState({
										deadlineCheckAll: true,
									});
								}
							} else {
								if (
									this.state.emailConfigData[i].firstDeliveryDateWarn ===
										"Yes" &&
									this.state.emailConfigData[i].firstDeliveryDateCross ===
										"Yes" &&
									this.state.emailConfigData[i].creativesUploadWarn === "Yes"
								) {
									this.setState({
										deadlineCheckAll: true,
									});
								}
							}

							if (this.state.role === "PC") {
								if (
									this.state.emailConfigData[i].dailyUpdate === "Yes" &&
									this.state.emailConfigData[i].linkAgencyPublisher === "Yes" &&
									this.state.emailConfigData[i].message === "Yes" &&
									this.state.emailConfigData[i].invoiceReviewed === "Yes"
								) {
									this.setState({ othersCheckAll: true });
								}
							} else {
								if (
									this.state.emailConfigData[i].linkAgencyPublisher === "Yes" &&
									this.state.emailConfigData[i].message === "Yes"
								) {
									this.setState({ othersCheckAll: true });
								}
							}
						}
					}
				});
		}
	}

	render() {
		return (
			<div style={{ backgroundColor: "rgb(241, 241, 241)" }}>
				<Navigation />
				<div
					className="container-fluid"
					style={{ paddingTop: "85px", paddingBottom: "60px" }}>
					<p style={{ paddingTop: "20px" }}>
						{/* //shivani-3285-passed ID for DI label consistency */}
						<h3 align="center" id="labelDI">
							Email Notification
						</h3>
						<hr style={{ border: "1px solid #e0e0e0" }} />
					</p>
					<form onSubmit={this.handleSubmit}>
						<div className="row">
							{this.state.role === "PC" || this.state.role === "PNC" ? (
								<div className="col-xs-12 col-sm-12 col-md-7 col-lg-7 col-xl-7">
									<p>
										<h4 style={{ fontFamily: "roboto" }}>
											Campaign Related Activity Notification
										</h4>
									</p>
									<div style={{ paddingBottom: "8px" }}>
										<Checkbox
											// indeterminate={this.state.campIndeterminate}
											onChange={this.campOnCheckAllChange}
											checked={this.state.campCheckAll}>
											Select All
										</Checkbox>
									</div>

									<div
										style={{
											background: "#fff",
											padding: "10px 15px 10px 15px",
											border: "1px solid #E9E9E9",
											width: "690px",
										}}>
										{this.state.role == "PC" ? (
											<Checkbox.Group
												style={{
													columnCount: "3",
													height: "150px",
													width: "690px",
												}}
												options={campActivity.map((campActivity) => ({
													label: campActivity.id,
													value: campActivity.name,
												}))}
												value={this.state.campCheckedList}
												onChange={this.campOnChange}
											/>
										) : (
											<Checkbox.Group
												style={{
													columnCount: "3",
													height: "150px",
													width: "690px",
												}}
												options={campActivityForNC.map((campActivityForNC) => ({
													label: campActivityForNC.id,
													value: campActivityForNC.name,
												}))}
												value={this.state.campCheckedListForNC}
												onChange={this.campOnChangeForNC}
											/>
										)}
									</div>
								</div>
							) : (
								""
							)}

							<div className="col-xs-12 col-sm-12 col-md-5 col-lg-5 col-xl-5">
								<p>
									<h4 style={{ fontFamily: "roboto" }}>
										Publisher Related Activity Notification
									</h4>
								</p>
								<div style={{ paddingBottom: "8px" }}>
									{this.state.role === "PQA" || this.state.role === "PNC" ? (
										""
									) : (
										<Checkbox
											// indeterminate={this.state.pubIndeterminate}
											onChange={this.pubOnCheckAllChange}
											checked={this.state.pubCheckAll}>
											Select All
										</Checkbox>
									)}
								</div>

								<div
									style={{
										background: "#fff",
										padding: "10px 15px 10px 15px",
										lineHeight: "20px",
										border: "1px solid #E9E9E9",
									}}>
									{this.state.role === "PC" ? (
										<Checkbox.Group
											style={{ display: "grid" }}
											options={pubActivity.map((pubActivity) => ({
												label: pubActivity.id,
												value: pubActivity.name,
											}))}
											value={this.state.pubCheckedList}
											onChange={this.pubOnChange}
										/>
									) : this.state.role === "PNC" ? (
										<Checkbox.Group
											style={{ display: "grid" }}
											options={pubActivityForNC.map((pubActivityForNC) => ({
												label: pubActivityForNC.id,
												value: pubActivityForNC.name,
											}))}
											value={this.state.pubCheckedListForNC}
											onChange={this.pubOnChangeForNC}
										/>
									) : (
										<Checkbox.Group
											style={{ display: "grid" }}
											options={pubActivityForQA.map((pubActivityForQA) => ({
												label: pubActivityForQA.id,
												value: pubActivityForQA.name,
											}))}
											value={this.state.pubCheckedListForQA}
											onChange={this.pubOnChangeForQA}
										/>
									)}

									{/* <Checkbox.Group style={{ width: '100%' , lineHeight: '30px'}} onChange={this.pubOnChange}>
                    <Row>
                      <Col span={12}>
                        <Checkbox value="cancelPublisher">Cancel Publisher</Checkbox>
                      </Col>
                      
                      <Col span={12}>
                        <Checkbox value="endDatePublisher">End Date Publisher</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="cancelPublisherCross">Cancel Publisher Cross</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="pocSubmit">POC Submit</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="csSubmit">CS Submit</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="pocReview">POC Review</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="lpSubmit">Landing Page Submit</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="creativeReview">Creative Review</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="reportPublisher">Report Publisher</Checkbox>
                      </Col>
                      <br/>
                    </Row>
                  </Checkbox.Group> */}
								</div>
							</div>
						</div>
						{/* end of 1st Row */}

						<br />
						<br />

						<div className="row">
							{this.state.role === "PC" || this.state.role === "PQA" ? (
								<div className="col-xs-12 col-sm-12 col-md-4 col-lg-4 col-xl-4">
									<p>
										<h4 style={{ fontFamily: "roboto" }}>
											Lead Related Activity Notification
										</h4>
									</p>
									{this.state.role === "PQA" ? (
										""
									) : (
										<div style={{ paddingBottom: "8px" }}>
											<Checkbox
												// indeterminate={this.state.leadIndeterminate}
												onChange={this.leadOnCheckAllChange}
												checked={this.state.leadCheckAll}>
												Select All
											</Checkbox>
										</div>
									)}
									<div
										style={{
											background: "#fff",
											padding: "10px 15px 10px 15px",
											minHeight: "88px",
											border: "1px solid #E9E9E9",
										}}>
										{this.state.role === "PC" ? (
											<Checkbox.Group
												style={{ display: "grid" }}
												options={leadActivity.map((leadActivity) => ({
													label: leadActivity.id,
													value: leadActivity.name,
												}))}
												value={this.state.leadCheckedList}
												onChange={this.leadOnChange}
											/>
										) : this.state.role === "PQA" ? (
											<Checkbox.Group
												style={{ display: "grid" }}
												options={leadActivityForQA.map((leadActivityForQA) => ({
													label: leadActivityForQA.id,
													value: leadActivityForQA.name,
												}))}
												value={this.state.leadCheckedListForQA}
												onChange={this.leadOnChangeForQA}
											/>
										) : (
											""
										)}

										{/* <Checkbox.Group style={{ width: '100%', lineHeight: '30px'}}
                       options={leadActivity}
                       value={this.state.leadCheckedList}
                       onChange={this.leadOnChange}
                                           /> */}
										{/* <Checkbox.Group style={{ width: '100%', lineHeight: '30px' }} onChange={this.leadOnChange}>
                  <Row>
                    <Col span={24}>
                      <Checkbox value="leadUpload">Lead Upload</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value="leadReview">Lead Review</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value="leadsDecrement">Leads Decrement</Checkbox>
                    </Col>
                   
                    <Col span={24}>
                      <Checkbox value="updateLeadsPermission">Update Leads Permission</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>  */}
									</div>
								</div>
							) : (
								""
							)}
							{this.state.role === "PQA" ? (
								""
							) : (
								<div className="col-xs-12 col-sm-12 col-md-4 col-lg-4 col-xl-4">
									<p>
										<h4 style={{ fontFamily: "roboto" }}>
											Deadline Notification
										</h4>
									</p>
									<div style={{ paddingBottom: "8px" }}>
										<Checkbox
											// indeterminate={this.state.deadlineIndeterminate}
											onChange={this.deadlineOnCheckAllChange}
											checked={this.state.deadlineCheckAll}>
											Select All
										</Checkbox>
									</div>

									<div
										style={{
											background: "#fff",
											padding: "10px 15px 10px 15px",
											border: "1px solid #E9E9E9",
										}}>
										{this.state.role === "PC" ? (
											<Checkbox.Group
												style={{ display: "grid" }}
												options={deadline.map((deadline) => ({
													label: deadline.id,
													value: deadline.name,
												}))}
												value={this.state.deadlineCheckedList}
												onChange={this.deadlineOnChange}
											/>
										) : (
											<Checkbox.Group
												style={{ display: "grid" }}
												options={deadlineForNC.map((deadlineForNC) => ({
													label: deadlineForNC.id,
													value: deadlineForNC.name,
												}))}
												value={this.state.deadlineCheckedListForNC}
												onChange={this.deadlineOnChangeForNC}
											/>
										)}
										{/* <Checkbox.Group style={{ width: '100%', lineHeight: '30px' }}
                    options={deadline}
                    value={this.state.deadlineCheckedList}
                    onChange={this.deadlineOnChange}
                  /> */}

										{/* <Checkbox.Group style={{ width: '100%',height: '100%', lineHeight: '30px' }} onChange={this.deadlineOnChange}>
                  <Row>
                    <Col span={24}>
                      <Checkbox value="firstDeliveryWarn">First Delivery Warn</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value="firstDeliveryDate">First Delivery Date Cross</Checkbox>
                    </Col>
                     <Col span={24}>
                      <Checkbox value="acceptCampaignWarn">Accept Campaign Warn</Checkbox>
                    </Col>
                    
                    <Col span={24}>
                      <Checkbox value="creativesUploadWarn">Creatives Upload Warn</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group> */}
									</div>
								</div>
							)}

							{this.state.role === "PQA" ? (
								""
							) : (
								<div className="col-xs-12 col-sm-12 col-md-4 col-lg-4 col-xl-4">
									<p>
										<h4 style={{ fontFamily: "roboto" }}>Other Notification</h4>
									</p>
									<div style={{ paddingBottom: "8px" }}>
										<Checkbox
											// indeterminate={this.state.othersIndeterminate}
											onChange={this.othersOnCheckAllChange}
											checked={this.state.othersCheckAll}>
											Select All
										</Checkbox>
									</div>
									<div
										style={{
											background: "#fff",
											padding: "10px 15px 10px 15px",
											border: "1px solid #E9E9E9",
										}}>
										{this.state.role === "PC" ? (
											<Checkbox.Group
												style={{ display: "grid" }}
												options={others.map((others) => ({
													label: others.id,
													value: others.name,
												}))}
												value={this.state.othersCheckedList}
												onChange={this.othersOnChange}
											/>
										) : (
											<Checkbox.Group
												style={{ display: "grid" }}
												options={othersForNC.map((othersForNC) => ({
													label: othersForNC.id,
													value: othersForNC.name,
												}))}
												value={this.state.othersCheckedListForNC}
												onChange={this.othersOnChangeForNC}
											/>
										)}
										{/* <Checkbox.Group style={{ width: '100%', lineHeight: '30px' }}
                    options={others}
                    value={this.state.othersCheckedList}
                    onChange={this.othersOnChange}
                  /> */}
										{/* <Checkbox.Group style={{ width: '100%', lineHeight: '30px' }} onChange={this.otherOnChange}>
                  <Row>
                    <Col span={24}>
                      <Checkbox value="dailyUpdate">Daily Update</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value="linkAgencyPublisher">Link Agency Publisher</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value="voiceLinkUpload">Voice Link Upload</Checkbox>
                    </Col>
                    <Col span={24}>		
                      <Checkbox value="newMessage">New Message</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group> */}
									</div>
								</div>
							)}
						</div>
						{/* end od 2nd row */}
						<br />
						<div class="row">
							<div className="col-xs-12 col-sm-12" style={{ float: "right" }}>
								<button
									type="primary"
									htmltype="submit"
									class="btn add-button"
									style={{ float: "right" }}>
									Submit
								</button>
							</div>
						</div>
					</form>
				</div>
				{/* end of container */}
				<Footer />
			</div>
		);
	}
}

PublisherEmailConfig.propTypes = {
	logoutUser: PropTypes.func.isRequired,
	auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	auth: state.auth,
});
export default connect(mapStateToProps, { logoutUser })(
	withRouter(PublisherEmailConfig)
);

//export default PublisherEmailConfig
