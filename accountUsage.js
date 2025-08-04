const endpoints = {
  'usageToDate': '/usage/overview',
  'usageForeCast': '/usage/audit/trends'

}

function pushAccountData () {
  	let usageData = apiRequest(endpoints.usageToDate,'v3', apiKey,'GET')
	let currentContractTerm = usageData.auditUsage.currentContractTerm
	let usageForecastData = apiRequest(endpoints.usageForeCast,'v3',apiKey,'POST',{currentContractTerm})

	console.log(usageData)

  	
	let contractTotal = usageData.auditUsage.usageLimit
  	let usedToDate = usageData.auditUsage.usageCount
	let futurePeriods = usageForecastData.futurePeriods
	
	if (futurePeriods.length > 0) {

		let forecasts = futurePeriods[Object.keys(futurePeriods)[Object.keys(futurePeriods).length - 1]]

		let historicalForecast = forecasts.cumulativeProjectedTotal.historicalUsageEstimate.total
		let scheduledForecast = forecasts.cumulativeProjectedTotal.scheduledUsageEstimate.total


		let endDate = usageData.auditUsage.currentContractTerm.endDateInclusive
		let endDataNumber = Math.floor(new Date (endDate).getTime() / 1000 / 60 / 60 / 24)
		let currentDateNumber = Math.floor(new Date ().getTime() / 1000 / 60 / 60 / 24)
		let daysRemaining = endDataNumber - currentDateNumber

		auditImplementationCalc.getRange('C5').setValue(contractTotal)
		auditImplementationCalc.getRange('H11').setValue(usedToDate)
		auditImplementationCalc.getRange('J9').setValue(daysRemaining)
		auditImplementationCalc.getRange('H9').setValue(historicalForecast)
		auditImplementationCalc.getRange('H10').setValue(scheduledForecast)

	} else {
		auditImplementationCalc.getRange('C5').setValue(contractTotal)
		auditImplementationCalc.getRange('H11').setValue(usedToDate)


		let accName = auditImplementationCalc.getRange('E11:F11').getValue().split(' - ')[1];
		SpreadsheetApp.getUi().alert(
		`${accName} has gone over their contract year, or their OP account hasn't updated to reflect a renewed contract.`
		);
	}
}
