/**
 * Questions asked about each business.
 *
 * Three "discovery" questions are what a customer would actually type: they
 * name the area and the kind of business, never the business. They are the
 * primary outcome. One "branded" question names the business and asks a
 * plain fact; it is a secondary outcome (is the business's own site the
 * source an AI uses when asked about it by name?) and a check that the
 * mention detector works (answers to it should almost always name it).
 *
 * The wording is fixed per category so every business in a category gets the
 * same questions; only the place and the service term change. Changing a
 * template changes the study - bump QUESTION_SET_VERSION if you do, and the
 * cache keys will no longer match the old answers.
 */
export const QUESTION_SET_VERSION = "q1";

const NEED = {
  歯科: (b) => `${b.area}で、痛みに配慮して治療してくれる${b.service_term}を探しています。どこがいいですか？`,
  飲食: (b) => `${b.area}で夕食に行くなら、おすすめの${b.service_term}のお店はどこですか？`,
  美容: (b) => `${b.area}でカットが上手いと評判の${b.service_term}を教えてください。`,
  士業: (b) => `${b.area}で、個人事業主の確定申告を相談できる${b.service_term}はどこがいいですか？`,
  宿泊: (b) => `${b.area}周辺で泊まるなら、おすすめの${b.service_term}はどこですか？`,
};

/** Place names used in questions: the neighbourhood, and the ward/city. */
function places(b) {
  const area = b.area || b.ward || b.city;
  const ward = b.ward || b.city;
  return { area, ward };
}

export function buildStudyQuestions(business) {
  const { area, ward } = places(business);
  const b = { ...business, area, ward };
  const need = NEED[b.category] || ((x) => `${x.area}でおすすめの${x.service_term}はどこですか？`);
  const discovery = [
    { qid: "d1", kind: "discovery", text: `${area}で${b.service_term}のおすすめを教えてください。` },
    { qid: "d2", kind: "discovery", text: `${ward}で人気の${b.service_term}を3つ挙げてください。` },
    { qid: "d3", kind: "discovery", text: need(b) },
  ];
  const branded = [
    { qid: "b1", kind: "branded", text: `${ward}の「${b.name}」の所在地と営業時間（受付時間）を教えてください。` },
  ];
  return [...discovery, ...branded].map((q) => ({ ...q, version: QUESTION_SET_VERSION }));
}
