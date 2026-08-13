// Which intake questionnaire a submission belongs to.
//
// The signed token deliberately does NOT carry the form kind. It is minted in two
// languages — JS here and Python in June's ~/.hermes/scripts/soraia_intake_link.py
// — and the two are held byte-identical by test_intake_link_parity.py. Adding a
// field would mean changing both in lockstep, and a drift there is invisible until
// a client clicks a link and gets a 403.
//
// So the form kind comes from the URL instead: /intake is the STR onboarding,
// /intake/newbuild is the new-construction intake. The token still does the only
// job that matters — proving this person may write into this Drive folder. Which
// set of questions they answered is not a security boundary, so it does not need
// to be signed. The worst case of a wrong `form` value is a brief written under
// the wrong headings for a deal that was already authorised.
import strSchema from './intake-questions.js'
import newbuildSchema from './intake-questions-newbuild.js'

export const DEFAULT_FORM = 'str'

const FORMS = {
  str: {
    schema: strSchema,
    // The original tab. Do not rename — existing rows are addressed by it.
    sheetTab: 'Submissions',
    briefTitle: 'Design Brief',
    route: '/intake',
  },
  newbuild: {
    schema: newbuildSchema,
    // Its own tab on purpose. The two questionnaires share almost no questions,
    // and since the Sheet addresses columns by label text, merging them would make
    // a ~130-column table where every row is two-thirds blank.
    sheetTab: 'Submissions — New Construction',
    briefTitle: 'Design Brief',
    route: '/intake/newbuild',
  },
}

export function isKnownForm(kind) {
  return Object.prototype.hasOwnProperty.call(FORMS, String(kind || ''))
}

/**
 * Resolve a form kind to its config. Falls back to the STR form rather than
 * throwing: an unknown value means an old client or a typo'd link, and the STR
 * schema simply drops question ids it does not recognise, so the failure mode is
 * a thin brief rather than a lost submission.
 */
export function getForm(kind) {
  return FORMS[String(kind || '')] || FORMS[DEFAULT_FORM]
}

export function formKinds() {
  return Object.keys(FORMS)
}
