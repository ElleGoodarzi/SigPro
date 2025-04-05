/**
 * Enhanced Signal Processing Library - Z-Transform Module
 * 
 * This module provides improved implementations of Z-transform operations with:
 * 1. Enhanced root finding algorithms (Jenkins-Traub and Aberth-Ehrlich)
 * 2. Accurate ROC (Region of Convergence) calculations
 * 3. Better numerical stability and error handling
 * 4. More precise factorization of rational Z-transforms
 */

// Import modules to re-export with CommonJS format
const zTransform = require('./z-transform');
const factorizer = require('./factorizer');
const rocCalculator = require('./roc-calculator');
const numericalUtils = require('./numerical-utils');
const rootFinder = require('./root-finder');
const jenkinsTraub = require('./jenkins-traub');
const aberthEhrlich = require('./aberth-ehrlich');

// Re-export all modules using CommonJS format
module.exports = {
  // Z-transform functionality
  computeZTransform: zTransform.computeZTransform,
  computeInverseZTransform: zTransform.computeInverseZTransform,
  multiplyZTransforms: zTransform.multiplyZTransforms,
  timeShiftZTransform: zTransform.timeShiftZTransform,
  calculateFrequencyResponse: zTransform.calculateFrequencyResponse,
  getCommonZTransform: zTransform.getCommonZTransform,
  ZTransformError: zTransform.ZTransformError,
  
  // Factorization functionality
  factorizeZTransform: factorizer.factorizeZTransform,
  formatFactorizedExpression: factorizer.formatFactorizedExpression,
  
  // ROC calculator functionality
  determineROC: rocCalculator.determineROC,
  analyzeSignal: rocCalculator.analyzeSignal,
  inferSignalType: rocCalculator.inferSignalType,
  combineROCs: rocCalculator.combineROCs,
  SignalType: rocCalculator.SignalType,
  ROCOperation: rocCalculator.ROCOperation,
  
  // Core numerical utilities
  complexAdd: numericalUtils.complexAdd,
  complexSubtract: numericalUtils.complexSubtract,
  complexMultiply: numericalUtils.complexMultiply,
  complexDivide: numericalUtils.complexDivide,
  complexScale: numericalUtils.complexScale,
  complexReciprocal: numericalUtils.complexReciprocal,
  complexMagnitude: numericalUtils.complexMagnitude,
  complexPhase: numericalUtils.complexPhase,
  evaluatePolynomial: numericalUtils.evaluatePolynomial,
  derivePolynomial: numericalUtils.derivePolynomial,
  evaluatePolynomialAndDerivative: numericalUtils.evaluatePolynomialAndDerivative,
  scaleCoefficients: numericalUtils.scaleCoefficients,
  syntheticDivision: numericalUtils.syntheticDivision,
  verifyRoots: numericalUtils.verifyRoots,
  
  // Root finding functionality
  findRoots: rootFinder.findRoots,
  RootFindingMethod: rootFinder.RootFindingMethod,
  RootFindingError: rootFinder.RootFindingError,
  
  // Specialized root-finding algorithms
  findRootsByJenkinsTraub: jenkinsTraub.findRootsByJenkinsTraub,
  findRootsByAberthEhrlich: aberthEhrlich.findRootsByAberthEhrlich
}; 