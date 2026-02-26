/**
 * RendementLoc - Simulateur de rendement locatif
 *
 * Tableau avec 2 colonnes :
 *   - Donnees : l'utilisateur saisit les 4 valeurs
 *   - Calcul  : chaque parametre est recalcule a partir des 3 AUTRES
 *
 * Formules (identiques au fichier Excel) :
 *   calc_achat     = (loyerAnnuel - chargesAnnuelles) / rendement
 *   calc_loyer     = (rendement * achat + chargesAnnuelles) / 12
 *   calc_charges   = loyerAnnuel - (rendement * achat)
 *   calc_rendement = (loyerAnnuel - chargesAnnuelles) / achat
 */

(function () {
    'use strict';

    // --- State ---
    var periods = {
        loyer: 'mensuel',
        charges: 'mensuel',
    };

    // --- DOM refs ---
    var inputs = {
        achat: document.getElementById('d-achat'),
        loyer: document.getElementById('d-loyer'),
        charges: document.getElementById('d-charges'),
        rendement: document.getElementById('d-rendement'),
    };

    var calcs = {
        achat: document.getElementById('c-achat'),
        loyer: document.getElementById('c-loyer'),
        charges: document.getElementById('c-charges'),
        rendement: document.getElementById('c-rendement'),
    };

    var annuals = {
        loyer: document.getElementById('a-loyer'),
        charges: document.getElementById('a-charges'),
    };

    // Equivalences (input side: show the other period)
    var equivs = {
        loyer: document.getElementById('eq-loyer'),
        charges: document.getElementById('eq-charges'),
    };

    // Equivalences (calc side: show the other period)
    var calcEquivs = {
        loyer: document.getElementById('ceq-loyer'),
        charges: document.getElementById('ceq-charges'),
    };

    // --- Period toggles ---
    document.querySelectorAll('.toggle-period').forEach(function (toggle) {
        var target = toggle.dataset.target;
        toggle.querySelectorAll('.period-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var oldPeriod = periods[target];
                var newPeriod = btn.dataset.period;
                if (oldPeriod === newPeriod) return;

                toggle.querySelectorAll('.period-btn').forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                // Convert current input value
                var input = inputs[target];
                var val = parseFloat(input.value);
                if (!isNaN(val) && val > 0) {
                    if (oldPeriod === 'mensuel' && newPeriod === 'annuel') {
                        input.value = round2(val * 12);
                    } else {
                        input.value = round2(val / 12);
                    }
                }

                periods[target] = newPeriod;
                calculate();
            });
        });
    });

    // --- Input listeners ---
    Object.values(inputs).forEach(function (input) {
        input.addEventListener('input', calculate);
    });

    // --- Reset ---
    document.getElementById('btn-reset').addEventListener('click', function () {
        Object.values(inputs).forEach(function (input) {
            input.value = '';
        });
        clearCalcs();
        document.querySelectorAll('.toggle-period').forEach(function (toggle) {
            var target = toggle.dataset.target;
            periods[target] = 'mensuel';
            toggle.querySelectorAll('.period-btn').forEach(function (btn) {
                btn.classList.toggle('active', btn.dataset.period === 'mensuel');
            });
        });
    });

    // --- Calculation ---
    function calculate() {
        var achat = parseVal(inputs.achat.value);
        var loyerRaw = parseVal(inputs.loyer.value);
        var chargesRaw = parseVal(inputs.charges.value);
        var rendementPct = parseVal(inputs.rendement.value);

        // Show input equivalences (mensuel <-> annuel)
        showInputEquiv('loyer', loyerRaw);
        showInputEquiv('charges', chargesRaw);

        // Convert to annual
        var loyerAnnuel = loyerRaw !== null ? toAnnual(loyerRaw, periods.loyer) : null;
        var chargesAnnuelles = chargesRaw !== null ? toAnnual(chargesRaw, periods.charges) : null;
        var rendement = rendementPct !== null ? rendementPct / 100 : null;

        // Calc achat = (loyerAnnuel - chargesAnnuelles) / rendement
        if (loyerAnnuel !== null && chargesAnnuelles !== null && rendement !== null && rendement !== 0) {
            calcs.achat.textContent = formatEuro((loyerAnnuel - chargesAnnuelles) / rendement);
        } else {
            calcs.achat.textContent = '--';
        }

        // Calc loyer mensuel = (rendement * achat + chargesAnnuelles) / 12
        if (achat !== null && chargesAnnuelles !== null && rendement !== null) {
            var calcLoyerMensuel = ((rendement * achat) + chargesAnnuelles) / 12;
            var calcLoyerAnnuel = calcLoyerMensuel * 12;
            calcs.loyer.textContent = formatEuro(calcLoyerMensuel);
            calcEquivs.loyer.textContent = formatEuro(calcLoyerAnnuel) + '/an';
            annuals.loyer.textContent = formatEuro(calcLoyerAnnuel);
        } else {
            calcs.loyer.textContent = '--';
            calcEquivs.loyer.textContent = '';
            annuals.loyer.textContent = '--';
        }

        // Calc charges annuelles = loyerAnnuel - (rendement * achat)
        if (achat !== null && loyerAnnuel !== null && rendement !== null) {
            var calcChargesAnnuelles = loyerAnnuel - (rendement * achat);
            var calcChargesMensuelles = calcChargesAnnuelles / 12;
            calcs.charges.textContent = formatEuro(calcChargesMensuelles);
            calcEquivs.charges.textContent = formatEuro(calcChargesAnnuelles) + '/an';
            annuals.charges.textContent = formatEuro(calcChargesAnnuelles);
        } else {
            calcs.charges.textContent = '--';
            calcEquivs.charges.textContent = '';
            annuals.charges.textContent = '--';
        }

        // Calc rendement = (loyerAnnuel - chargesAnnuelles) / achat
        if (achat !== null && achat !== 0 && loyerAnnuel !== null && chargesAnnuelles !== null) {
            var calcRendement = ((loyerAnnuel - chargesAnnuelles) / achat) * 100;
            calcs.rendement.textContent = formatPct(calcRendement);
        } else {
            calcs.rendement.textContent = '--';
        }
    }

    function showInputEquiv(field, rawVal) {
        if (rawVal === null) {
            equivs[field].textContent = '';
            return;
        }
        var period = periods[field];
        if (period === 'mensuel') {
            equivs[field].textContent = 'soit ' + formatEuro(rawVal * 12) + '/an';
        } else {
            equivs[field].textContent = 'soit ' + formatEuro(rawVal / 12) + '/mois';
        }
    }

    function clearCalcs() {
        Object.values(calcs).forEach(function (el) { el.textContent = '--'; });
        Object.values(annuals).forEach(function (el) { el.textContent = '--'; });
        Object.values(equivs).forEach(function (el) { el.textContent = ''; });
        Object.values(calcEquivs).forEach(function (el) { el.textContent = ''; });
    }

    // --- Helpers ---
    function parseVal(str) {
        if (str === '' || str === undefined || str === null) return null;
        var v = parseFloat(str);
        return isNaN(v) ? null : v;
    }

    function toAnnual(value, period) {
        return period === 'mensuel' ? value * 12 : value;
    }

    function formatEuro(val) {
        return val.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }

    function formatPct(val) {
        return val.toLocaleString('fr-FR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
        }) + ' %';
    }

    function round2(val) {
        return Math.round(val * 100) / 100;
    }

    // --- Service Worker ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function () {});
    }
})();
