/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LocalStorage } from './util/localStorage';
import request from 'request';

let vscodeContext: vscode.ExtensionContext | null = null;

vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
	const localStorage = new LocalStorage(vscodeContext?.workspaceState as vscode.Memento);
	const url = 'http://localhost:3000/class/update';
	if (localStorage.getValue('token')) {
		if (localStorage.getValue('name')) {
			request({
				method: 'POST',
				uri: url,
				headers: {
					Authorization: 'Bearer ' + localStorage.getValue('token'),
					'Content-Type': 'application/json'
				},
				form: {
					name: localStorage.getValue('name'),
					file: document.fileName,
					content: document.getText()
				},
				json: true
			}, (err, res, body) => {
				if (err) {
					vscode.window.showErrorMessage('Error: ' + err);
				} else {
					vscode.window.showInformationMessage('Live session updated');
				}
			});
			vscode.window.showInformationMessage('Live session updated');
		} else {
			vscode.window.showErrorMessage('Class not found');
		}
	}
});

function stopLive(context: vscode.ExtensionContext) {
	const localStorage = new LocalStorage(context.workspaceState);
	const url = 'http://localhost:3000/class/stop';
	if (localStorage.getValue('token')) {
		if (localStorage.getValue('name')) {
			request({
				method: 'POST',
				uri: url,
				headers: {
					Authorization: 'Bearer ' + localStorage.getValue('token'),
					'Content-Type': 'application/json'
				},
				form: {
					name: localStorage.getValue('name')
				},
				json: true
			}, (err, res, body) => {
				if (err) {
					vscode.window.showErrorMessage('Error: ' + err);
				} else {
					vscode.window.showInformationMessage('Live session stopped: ' + localStorage.getValue('name'));
					localStorage.setValue('code', null);
					localStorage.setValue('name', null);
				}
			});
		} else {
			vscode.window.showErrorMessage('Class not found');
		}
	} else {
		vscode.window.showErrorMessage('Login first');
	}
}

export function activate(context: vscode.ExtensionContext) {
	vscodeContext = context;
	const localStorage = new LocalStorage(context.workspaceState);
	localStorage.setValue('token', null);
	localStorage.setValue('code', null);
	localStorage.setValue('name', null);
	let disposable = vscode.commands.registerCommand('supsup.login', async () => {
		if (!localStorage.getValue('token')) {
			const url = 'http://localhost:3000/auth/login';
			const idInput = await vscode.window.showInputBox({
				placeHolder: 'Enter your id',
				ignoreFocusOut: true,
			});
			if (idInput) {
				const pwInput = await vscode.window.showInputBox({
					placeHolder: 'Enter your password',
					ignoreFocusOut: true,
					password: true,
				});

				if (pwInput) {
					request({
						method: 'POST',
						uri: url,
						form: {
							id: idInput,
							password: pwInput,
						}
					}, (err, res, body) => {
						if (err) {
							vscode.window.showErrorMessage('Login Failed');
							return;
						} else {
							localStorage.setValue('token', JSON.parse(body).accessToken);
							vscode.window.showInformationMessage('Login Success');
						}
					});
				} else {vscode.window.showErrorMessage('Login Failed');}
			} else {vscode.window.showInformationMessage('Login Failed');}
		} else { vscode.window.showInformationMessage('Already Logged In'); }
	});

	let disposable2 = vscode.commands.registerCommand('supsup.logout', async () => {
		if (localStorage.getValue('token')) {
			stopLive(context);
			localStorage.setValue('token', null);
			vscode.window.showInformationMessage('Logged Out');
		} else {
			vscode.window.showErrorMessage('Not Logged In');
		}
	});

	let disposable3 = vscode.commands.registerCommand('supsup.start', async () => {
		if (localStorage.getValue('token')) {
			if (!localStorage.getValue('code')) {
				const url = 'http://localhost:3000/class/start';
				const nameInput = await vscode.window.showInputBox({
					placeHolder: 'Enter your class name',
					ignoreFocusOut: true,
				});
				if (nameInput) {
					request({
						method: 'POST',
						uri: url,
						headers: {
							Authorization: 'Bearer ' + localStorage.getValue('token'),
							'Content-Type': 'application/json'
						},
						form: {
							name: nameInput
						},
						json: true
					}, (err, res, body) => {
						if (err) {
							vscode.window.showErrorMessage('Error: ' + err);
						} else {
							localStorage.setValue('code', body.extension);
							localStorage.setValue('name', nameInput);
							vscode.window.showInformationMessage('Class started');
						}
					});
				} else {vscode.window.showErrorMessage('Enter');}
			} else {
				vscode.window.showErrorMessage('Class already started');
			}
		} else {
			vscode.window.showErrorMessage('Not Logged In');
		}
	});

	let disposable4 = vscode.commands.registerCommand('supsup.stop', async () => {
		stopLive(context);
	});

	let disposable5 = vscode.commands.registerCommand('supsup.join', async () => {
		if (!localStorage.getValue('token')) {
			const url = 'http://localhost:3000/class/join';
			const codeInput = await vscode.window.showInputBox({
				placeHolder: 'Enter the class code',
				ignoreFocusOut: true,
			});
			if (codeInput) {
				request({
					method: 'POST',
					uri: url,
					headers: {
						'Content-Type': 'application/json'
					},
					body: {
						extension: codeInput
					},
					json: true
				}, (err, res, body) => {
					if (err) {
						vscode.window.showErrorMessage('Error: ' + err);
					} else {
						localStorage.setValue('joinCode', codeInput);
						vscode.window.showInformationMessage('Joined the class');
						vscode.window.createWebviewPanel(
							'join',
							'Join',
							vscode.ViewColumn.One,
							{
								enableScripts: true,
								retainContextWhenHidden: true,
							}
						);
					}
				});
			}
		} else {
			vscode.window.showErrorMessage('Logout first');
		}
	});

	let disposable6 = vscode.commands.registerCommand('supsup.leave', async () => {
		if (localStorage.getValue('joinCode')) {
			localStorage.setValue('joinCode', null);
			vscode.window.showInformationMessage('Left the class');
		} else {
			vscode.window.showErrorMessage('Not joined');
		}
	});

	vscodeContext.subscriptions.push(disposable);
	vscodeContext.subscriptions.push(disposable2);
	vscodeContext.subscriptions.push(disposable3);
	vscodeContext.subscriptions.push(disposable4);
	vscodeContext.subscriptions.push(disposable5);
	vscodeContext.subscriptions.push(disposable6);
}

export function deactivate() {
	stopLive(vscodeContext as vscode.ExtensionContext);	
}
