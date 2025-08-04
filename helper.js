//main spreadsheet
const ss = SpreadsheetApp.getActiveSpreadsheet();

//sub sheets

const auditImplementationCalc = ss.getSheetByName('Audit Implementation Calculator');

function getBearer() {
	var creds = {
		username: 'username',
		password: 'password',
	};

	var options = {
		method: 'post',
		payload: JSON.stringify(creds),
		contentType: 'application/json',
	};

	var response = JSON.parse(UrlFetchApp.fetch('https://auth.observepoint.com/login', options));
	return response.accessToken;
}

function apiRequest(endpoint, version, token, method, payload) {
  var url = `https://api.observepoint.com/${version}${endpoint}`;
  var options = {
    'method': method,
    'headers': {
      Authorization: token
    },
    'payload': JSON.stringify(payload),
    'contentType': 'application/json'
  };
  if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH') options.payload = JSON.stringify(payload);
  var ret = UrlFetchApp.fetch(url, options);
  var output;
  try {output = JSON.parse(ret);} catch (e) {output = {};};
  return output;
}

function getAccountsList() {
	let body = {
		search: '',
		types: [2, 3],
		statuses: ['ACTIVE'],
	};

	let getAccounts = () => {
		let page = 0;
		let endpoint = `/accounts/search?size=200&page=${page}&sortBy=id&sortDesc=false`;
		let accountsReturn = apiRequest(endpoint, 'v3', `bearer ${getBearer()}`, 'POST', body);
        let accounts = new Array();
		accountsReturn.accounts.forEach((account) => {
			accounts.push(account);
		});
		page++;
		while (accountsReturn.accounts.length > 0) {
			endpoint = `/accounts/search?size=200&page=${page}&sortBy=id&sortDesc=false`;
			accountsReturn = apiRequest(endpoint, 'v3', `bearer ${getBearer()}`, 'POST', body);
			accountsReturn.accounts.forEach((account) => {
				accounts.push(account);
			});
			page++;
		}
		return accounts;
	};
	let accounts = getAccounts().map((e) => `${e.id} - ${e.company}`);

	return accounts;
}

//this function has to run daily
function updateAccountsInSheets() {
	let accounts = getAccountsList();

	let sheetArray = [auditImplementationCalc];

	sheetArray.forEach((sheet) => {
		let accountsColumn = sheet.getRange('E11:F11');
		let accountsRule = SpreadsheetApp.newDataValidation().requireValueInList(accounts).build();

		accountsColumn.setDataValidation(accountsRule);
		SpreadsheetApp.flush();
	});
}

function getApiFromAccountID(value) {
	try {
		let accID = value.split(' - ')[0];

		let accountToken = apiRequest('/admin/login-as-user','v2', `bearer ${getBearer()}`, 'POST', { accountId: Number(accID)}).accessToken;

		let apiKey = apiRequest('/users/api-key', 'v2', `Bearer ${accountToken}`,'GET').key.accessToken;

		return apiKey;
	} catch (e) {
		SpreadsheetApp.getUi().alert(
			`Error while trying to get the API Key for account ${value}. \n\nPlease check if the account has a generated API Key, you might have to generate it manually.\n\nAlso please make sure you have selected a valid account from the dropdown.`
		);
		console.log(`Error while trying to get the API Key for account ${value}`);
		console.log(e);
		return null;
	}
}

let apiKey = `api_key ${getApiFromAccountID(auditImplementationCalc.getRange('E11:F11').getValue())}`
