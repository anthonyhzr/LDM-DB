function removeAllChildNodes(parent) {
    while (parent.childElementCount !== 1) {
        parent.removeChild(parent.lastChild);
    }
}

function valiation(){
    let empty = false;
    const studyName = document.getElementById("studyName").value;
    const contactTime = document.getElementById("contactTime").value;
    const outcome = document.getElementById("outcome").value;
    if(studyName === "" || contactTime === "" || outcome===""){
        alert('Please fill all the required information');
        empty = true;
    }
    return empty;
}

function displayStudy(studies){
    const studySelect = document.getElementById('studyName');
    studies.map(study => {
        const newOption = document.createElement('option');
        newOption.textContent = study.studyName;
        studySelect.appendChild(newOption);
    });
}

function getStudy(){
    removeAllChildNodes(document.getElementById("studyName"));
    const req = new XMLHttpRequest();
    req.open('GET', '/studyData');
    req.addEventListener('load', function() {
        console.log(req.status, req.responseText);
        if(req.status >= 200 && req.status < 300) {
            const studies = JSON.parse(req.responseText);
            displayStudy(studies);
        }
    });
    req.addEventListener('error', function(evt){
        console.log(evt);
    });
    req.send();
}

function addOutcomeToDb(tmpArray){
    const id = document.getElementById('historyId').value;
    const req = new XMLHttpRequest();
    const url = '/baby/addHistory/'+id;
    req.open('POST', url);
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    req.addEventListener('error', function(evt){
        console.log(evt);
    });
    req.send('outcome='+tmpArray);
}

function addContactOutcome(){
    const req = new XMLHttpRequest();
    req.open('GET', '/currentUser');
    req.addEventListener('load', function() {
        console.log(req.status, req.responseText);
        if(req.status >= 200 && req.status < 300) {
            const user = JSON.parse(req.responseText);
            const studyName = document.getElementById("studyName").value;
            const contactTime = document.getElementById("contactTime").value;
            const outcome = document.getElementById("outcome").value;
            const tmpArray = [studyName, contactTime, outcome, user.user];
            addOutcomeToDb(tmpArray);
            const newTr = document.createElement("tr");
            tmpArray.map(ele => {
                const newTd = document.createElement("td");
                newTd.setAttribute("class", "px-6 py-4 whitespace-no-wrap border-b text-blue-900 border-gray-500 text-sm leading-5");
                newTd.textContent = ele;
                newTr.appendChild(newTd);
            });
            document.getElementById("resultList").appendChild(newTr);
            document.getElementById("studyName").value = "";
            document.getElementById("contactTime").value = "";
            document.getElementById("outcome").value = "";
            document.querySelector('#addStudy').style.display = 'none';
        }
    });
    req.addEventListener('error', function(evt){
        console.log(evt);
    });
    req.send();
}

// Client ID and API key from the Developer Console
const CLIENT_ID = 'Your Client ID';
const API_KEY = 'Your API Key';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES =
    'https://www.googleapis.com/auth/gmail.readonly '+
    'https://www.googleapis.com/auth/gmail.send';

const sendEmailBtn = document.getElementById('sendEmailBtn');

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        sendEmailBtn.style.display = 'block';
        //listLabels();
        //sendEmail();
    } else {
        sendEmailBtn.style.display = 'none';
    }
}

function sendMessage(headers_obj, message, callback)
{
    var email = '';
    for(var header in headers_obj)
        email += header += ": "+headers_obj[header]+"\r\n";
    email += "\r\n" + message;
    var sendRequest = gapi.client.gmail.users.messages.send({
        'userId': 'me',
        'resource': {
            'raw': window.btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
        }
    });
    return sendRequest.execute(callback);
}

function emailAlert(){
    alert('Email sent!');
    document.getElementById('emailAddress').value = "";
    document.getElementById('message').value = "";
    document.getElementById('subject').value = "";
    document.querySelector('#addEmail').style.display = 'none';
}

function sendEmail() {
    const recipient = document.getElementById('emailAddress').value;
    const message = document.getElementById('message').value;
    const subject = document.getElementById('subject').value;
    if(recipient === "" || message === "" || subject === ""){
        alert("Fill all the fields!");
    }
    else{
        sendMessage(
            {
                'To': recipient,
                'Subject': subject
            },
            message,
            emailAlert
        );

        return false;
    }
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        sendEmailBtn.onclick=sendEmail;
        //authorizeButton.onclick = handleAuthClick;
        //signoutButton.onclick = handleSignoutClick;
    }, function(error) {
        return error;
    });
}

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function main(){
    const addBtn = document.getElementById('addStudyBtn');
    addBtn.addEventListener('click', function(){
        getStudy();
        document.querySelector('#addStudy').style.display = 'block';
    });

    const cancelBtn = document.getElementById('cancelBtn');
    cancelBtn.addEventListener('click', function(){
        //removeAllChildNodes(document.getElementById("studyName"));
        document.querySelector('#addStudy').style.display = 'none';
    });

    const emailBtn = document.getElementById('emailBtn');
    emailBtn.addEventListener('click', function(){
        getStudy();
        document.querySelector('#addEmail').style.display = 'block';
    });

    const cancelEmailBtn = document.getElementById('cancelEmailBtn');
    cancelEmailBtn.addEventListener('click', function(){
        //removeAllChildNodes(document.getElementById("studyName"));
        document.querySelector('#addEmail').style.display = 'none';
    });

    const addContactBtn = document.getElementById('addContactBtn');
    addContactBtn.addEventListener('click', function(){
        if(!valiation()){
            addContactOutcome();
        }
    });
}

document.addEventListener('DOMContentLoaded', main);