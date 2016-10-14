var customerIndexBase = 0;

var MsgType = {
	OPEN : 0,
	MSG : 1,
	CLOSE : 2,
	ERROR : 3
};

var BROADCAST_CUSOMTER = 'all';
var SERVER_MSG_CUSTOMER = 'server';
var CHAT_MSG = 'chat message';
var CONNECTION = 'connection';
var DISCONNECT = 'disconnect';
var CONNECT_TO_SERVER = 'connectServer';
var SERVER_ACKNOWLEDGED_CONNECT = 'serverAcqConn';
var DUMMY_MSG = 'NA';
var FAIL_CONNECT_COMPANY_AGENT = 'failConnectCompanyAgent'

function CustomerMsg(msg, type, id) {
	this.msg = msg;
	this.type = type;
	this.customerId = id;
}

function buildOpenMsg(customerId) {
	return new CustomerMsg(null, MsgType.OPEN, customerId);
}

function buildCloseMsg(customerId) {
	return new CustomerMsg(null, MsgType.CLOSE, customerId);
}

function buildErrorMsg(customerId) {
	return new CustomerMsg(null, MsgType.ERROR, customerId);
}

function buildCommonMsg(customerId, msg) {
	return new CustomerMsg(msg, MsgType.MSG, customerId);
}

function CompanyAgentMsg(customerId, msg) {
	this.customerId = customerId;
	this.msg = msg;
}

function getCompanyAgentMsg(msg) {
	if (!msg) return null;
	var msgData = JSON.parse(msg);
	if (!msgData) return null;
	if ((!msgData.customerId) || (!msgData.msg)) return null;
	return new CompanyAgentMsg(msgData.customerId, msgData.msg);
}

function Customer(socket, communication) {
	this.id = 'Customer' + customerIndexBase;
	++customerIndexBase;
	this.socket = socket;
	this.communication = null;
	var self = this;
	this.socket.on(DISCONNECT, function(){
		console.log('Customer ' + self.id + ' disconnected');
		if (self.communication) {
			self.communication.sendMsgToCompanyAgent(buildCloseMsg(self.id));
			self.communication.removeCustomer(self);
		}
	});
	this.socket.on(CHAT_MSG, function(msg){
		console.log('message from Customer ' + self.id + ': ' + msg);
		if (self.communication) {
			self.communication.sendMsgToCompanyAgent(buildCommonMsg(self.id, msg));
		}
	});
	if (typeof this.setCommunication !== "function") {
		Customer.prototype.setCommunication = function(communication) {
			this.communication = communication;
		};
	}
}

function Communication(socket) {
	this.companyAgentSocket = socket;
	this.customers = {};
	if (typeof this.addCustomer !== "function") {
		Communication.prototype.addCustomer = function(customer) {
			if ((!customer) || (!customer.id)) return;
			console.log('Send open msg to company agent for ' + customer.id);
			customer.setCommunication(this);
			this.customers[customer.id] = customer;
			this.sendMsgToCompanyAgent(buildOpenMsg(customer.id));
		};
	}
	if (typeof this.removeCustomer !== "function") {
		Communication.prototype.removeCustomer = function(customer) {
			if ((!customer) || (!customer.id)) return;
			this.customers[customer.id] = null;
		};
	}
	if (typeof this.clear !== "function") {
		Communication.prototype.clear = function() {
			this.customers = {};
		};
	}
	if (typeof this.sendMsgToCompanyAgent !== "function") {
		Communication.prototype.sendMsgToCompanyAgent = function(customerMsg) {
			if (customerMsg) {
				console.log('Send msg to company agent: ' + customerMsg);
				this.companyAgentSocket.emit(CHAT_MSG, JSON.stringify(customerMsg));
			}
		};
	}
	if (typeof this.sendMsgToCustomer !== "function") {
		Communication.prototype.sendMsgToCustomer = function(company, companyAgentMsg) {
			if ((!companyAgentMsg) || (!companyAgentMsg.customerId)) {
				console.log('Empty company agent message or empty customerId in this company agent message');
				return;
			}
			var customerId = companyAgentMsg.customerId;
			if (SERVER_MSG_CUSTOMER === customerId) {
				console.log('Receive message to Server: ' + companyAgentMsg.msg + ' from ' + company);
				return; // Ignore the messages for server.
			}
			if (BROADCAST_CUSOMTER === customerId) {
				console.log('Receive broadcast message: ' + companyAgentMsg.msg);
				for (var customerId in this.customers) {
					if (this.customers[customerId]) {
						this.customers[customerId].socket.emit(CHAT_MSG, company + ' Agent: ' + companyAgentMsg.msg);
					}
				}
				return;
			}
			var customer = this.customers[customerId];
			if (!customer) {
				console.log('Receive valid company agent message, but cannot find corresponding customer: ' + customerId);
				return;
			}
			customer.socket.emit(CHAT_MSG, company + ' Agent: ' + companyAgentMsg.msg);
		};
	}
}

function CompanyAgentSessions() {
	this.communications = {};
	if (typeof this.addCompanyAgentSession !== "function") {
		CompanyAgentSessions.prototype.addCompanyAgentSession = function(company, socket) {
			if (!company) return;
			console.log('Add company agent session for ' + company);
			this.communications[company] = new Communication(socket);
		};
	}
	if (typeof this.addCustomer !== "function") {
		CompanyAgentSessions.prototype.addCustomer = function(company, customer) {
			if (!company) return;
			var communication = this.communications[company];
			if (communication) {
				communication.addCustomer(customer);
				return true;
			}
			console.log('Cannot find company agent session of ' + company + ', failed to add its customer!');
			return false;
		};
	}
	if (typeof this.removeCompanyAgentSession !== "function") {
		CompanyAgentSessions.prototype.removeCompanyAgentSession = function(company) {
			if (!company) return;
			var communication = this.communications[company];
			if (communication) {
				communication.clear();
				this.communications[company] = null;
			}
		};
	}
	if (typeof this.sendMsgToCustomer !== "function") {
		CompanyAgentSessions.prototype.sendMsgToCustomer = function(company, msg) {
			if ((!company) || (!msg)) return;
			var communication = this.communications[company];
			if (communication) {
				console.log('Send message from ' + company + ' agent to customer: ' + msg);
				communication.sendMsgToCustomer(company, msg);
			}
		};
	}
}

var companyAgentSessions = new CompanyAgentSessions();
var rf=require("fs");

function getSharedFilePath(fileName) {
	return __dirname + '/shared/' + fileName;
}

function getCompanySpecificFileData(fileName, company) {
	var path = __dirname + '/companies/commonTemplates/' + fileName; // We can support special templates for specific companies in future
	var fileData = rf.readFileSync(path,'utf-8');
	if (fileData) {
		//console.log('Get file data of "' + path +'", and the company placeholder replaced by ' + company);
		return fileData.replace(/{LIVE_CHAT_COMPANY}/g, company);
	}
	return null;
}

function customerServerSetup(path, app, io) {
	app.get(path, function(req, res){
		var company = req.query.company;
		if (!company) return;
		res.send(getCompanySpecificFileData('customerWidget.html', company));
		//console.log('Handle a get request from customer of ' + company);
	});
	
	io.on(CONNECTION, function(socket){
		socket.on(CONNECT_TO_SERVER, function(company) {
			var customer = new Customer(socket);
			console.log(customer.id + ' connected');
			if (companyAgentSessions.addCustomer(company, customer)) {
				socket.emit(SERVER_ACKNOWLEDGED_CONNECT, DUMMY_MSG);
			} else {
				socket.emit(FAIL_CONNECT_COMPANY_AGENT, DUMMY_MSG);
			}
		});
	});
}

function companyAgentServerSetup(path, app, io) {
	app.get(path, function(req, res){
		var company = req.query.company;
		if (!company) return;
		res.send(getCompanySpecificFileData('companyAgentWorkplace.html', company));
		//console.log('Handle a get request from ' + company + ' agent');
	});
	
	io.on(CONNECTION, function(socket){
		socket.on(CONNECT_TO_SERVER, function(company) {
			console.log(company + ' agent is connected.');
			companyAgentSessions.addCompanyAgentSession(company, socket);
			socket.emit(SERVER_ACKNOWLEDGED_CONNECT, DUMMY_MSG);
		
			socket.on(DISCONNECT, function(){
				console.log(company + ' Agent disconnected');
				companyAgentSessions.removeCompanyAgentSession(company);
			});
			
			socket.on(CHAT_MSG, function(msg){
				console.log('message from ' + company + ' Agent: ' + msg);
				companyAgentSessions.sendMsgToCustomer(company, getCompanyAgentMsg(msg));
			});
		});
	});
}

function filesServerSetup(path, app) {
	app.get(path, function(req, res){
		if (req.query.file) {
			if (req.query.company) {
				//console.log('Send file "' + req.query.file +'" with company specific information replaced');
				res.send(getCompanySpecificFileData(req.query.file, req.query.company));
			} else {
				var filePath = getSharedFilePath(req.query.file);
				//console.log('Directly send file "' + filePath +'"');
				res.sendFile(filePath);
			}
		}
	});
}

function entry() {
	function prepareServer(port, path, callback, socketIOServer) {
		var app = require('express')();
		var http = require('http').Server(app);
		http.listen(port, function(){
			console.log('listening on *:' + port);
		});
		
		var io = null;
		if (socketIOServer) {
			io = require('socket.io')(http);
		}
		callback(path, app, io);
	}
	
	prepareServer(10082, '/Files', filesServerSetup, false);
	prepareServer(10080, '/Customer', customerServerSetup, true);
	prepareServer(10081, '/CompanyAgent', companyAgentServerSetup, true);
}

entry();
