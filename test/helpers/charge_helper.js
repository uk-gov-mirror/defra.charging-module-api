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

function dummyCalculation () {
  return {
    __DecisionID__: 'a0a4da26-3b82-4506-8a92-45919f5a4a5e0',
    WRLSChargingResponse: {
      chargeValue: 12.63,
      decisionPoints: {
        sourceFactor: 0.7173,
        seasonFactor: 1.14768,
        lossFactor: 1.14768,
        volumeFactor: 3.5865,
        abatementAdjustment: 12.629070720000001,
        s127Agreement: 12.629070720000001,
        s130Agreement: 12.629070720000001,
        secondPartCharge: false,
        waterUndertaker: false,
        eiucFactor: 0.0,
        compensationCharge: false,
        eiucSourceFactor: 0.0,
        sucFactor: 31.572676800000004
      },
      messages: [],
      sucFactor: 27.51,
      volumeFactor: 3.5865,
      sourceFactor: 0.2,
      seasonFactor: 1.6,
      lossFactor: 1.0,
      abatementAdjustment: 'S126 x 0.4',
      s127Agreement: null,
      s130Agreement: null,
      eiucSourceFactor: 0.0,
      eiucFactor: 0.0
    }
  }
}

module.exports = {
  dummyCharge,
  dummyCalculation
}
