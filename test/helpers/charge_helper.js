function dummyCharge () {
  return {
    __DecisionID__: 'test',
    WRLSChargingResponse: {
      chargeValue: 12345,
      decisionPoints: {
        sourceFactor: 0.221,
        seasonFactor: 0.4242,
        lossFactor: 0.23234,
        volumeFactor: 0.2323234,
        abatementAdjustment: 0.121,
        s127Agreement: 0.121212,
        s130Agreement: 0.1231231,
        secondPartCharge: false,
        waterUndertaker: false,
        eiucFactor: 0.3313,
        compensationCharge: false,
        eiucSourceFactor: 0.33221,
        sucFactor: 0.23134124
      },
      messages: [],
      sucFactor: 0.12123,
      volumeFactor: 0.012312,
      sourceFactor: 0.2121,
      seasonFactor: 0.121,
      lossFactor: 0.521,
      abatementAdjustment: null,
      s127Agreement: null,
      s130Agreement: null,
      eiucSourceFactor: 0.32311,
      eiucFactor: 0.31322
    }
  }
}

module.exports = {
  dummyCharge
}
