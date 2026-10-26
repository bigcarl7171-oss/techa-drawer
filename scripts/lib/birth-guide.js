const fs = require('fs');
const path = require('path');
const { ROOT } = require('./site-registry');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/birth-guides.json'), 'utf8'));
const credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/birth-guide-photo-credits.json'), 'utf8'));
const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/store-links.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/techa-products.json'), 'utf8'));
const view = require('../../assets/js/birth-guide');
const images = {
  'rose-hydrangea-bouquet':'/assets/images/home/rose-hydrangea-bouquet.jpg',
  'hydrangea-bouquet':'/assets/images/home/hydrangea-blue.jpg',
  'superior-rose':'/assets/images/gift-finder/superior-rose-02.webp',
  'carnation-rose-bouquet':'/assets/images/gift-finder/carnation-rose-bouquet-02.webp',
  'glassdome-moodlamp':'/assets/images/home/glassdome-rose.jpg',
  'hydrangea-moodlamp':'/assets/images/home/hydrangea-moodlamp-shelf.jpg',
  'cup-moodlamp-single':'/assets/images/gift-finder/cup-moodlamp-single-02.webp',
  'ionantha-moodlamp':'/assets/images/gift-finder/ionantha-moodlamp-02.webp',
  'sunflower-bouquet':'/assets/images/home/sunflower-bouquet.jpg',
  'sunflower-frame':'/assets/images/gift-finder/sunflower-frame-02.webp',
  'single-stem-soap-box':'/assets/images/gift-finder/single-stem-soap-box-02.webp',
  'flower-postcard':'/assets/images/gift-finder/flower-postcard-02.webp'
};
const reasons = {
  'rose-hydrangea-bouquet':'프리저브드 장미와 수국을 함께 담은 꽃다발입니다. 파랑·보라·레드 등 판매 색상을 비교해 보세요.',
  'hydrangea-bouquet':'프리저브드 수국을 담았습니다. 핑크·화이트·블루 옵션에서 좋아하는 분위기를 골라 보세요.',
  'superior-rose':'프리저브드 장미를 중심으로 고르고 싶을 때 살펴볼 상품입니다.',
  'carnation-rose-bouquet':'비누꽃 송이에 프리저브드 필러를 더한 꽃다발입니다. 원하는 색과 구성을 상품 옵션에서 확인하세요.',
  'glassdome-moodlamp':'꽃을 건넨 뒤에도 조명으로 곁에 둘 수 있는 유리돔 무드등입니다.',
  'hydrangea-moodlamp':'스카이블루·펄화이트·소프트핑크 색상을 비교해 고르는 수국 꽃 무드등입니다.',
  'cup-moodlamp-single':'장미 한 송이와 빛을 담은 작은 꽃 선물입니다. 파랑·레드·핑크 등 색상을 살펴보세요.',
  'ionantha-moodlamp':'이오난사와 스칸디아모스의 초록을 담은 소품입니다. 잎과 초록의 분위기를 좋아하는 분께 살펴보세요.',
  'sunflower-bouquet':'비누꽃 해바라기에 프리저브드 필러를 더한 노란 꽃다발입니다.',
  'sunflower-frame':'프리저브드 해바라기를 액자에 담았습니다. 꽃다발을 건넨 뒤 둘 자리가 고민될 때 살펴보세요.',
  'single-stem-soap-box':'비누꽃 한두 송이를 투명 상자에 담은 작은 선물입니다.',
  'flower-postcard':'프리저브드 꽃과 짧은 카드 문구를 함께 전할 수 있는 꽃엽서입니다.'
};
function context(kind) {
  const products = {};
  for (const p of Object.values(store.products)) {
    if (!images[p.line]) continue;
    const line = catalog.lines.find(x => x.id === p.line);
    products[p.line] = {...p, image:images[p.line], alt:p.name + ' 디자인 참고 사진', material:Array.isArray(line.material) ? line.material.join(' · ') : line.material, reason:reasons[p.line]};
  }
  return {kind, entries:data[kind], defaultMonth:data.defaultMonth, sources:data.sources, credits, products, reviewedAt:data.reviewedAt};
}
function productBlock(kind) {
  const ctx = context(kind), entry = ctx.entries.find(x => x.month === ctx.defaultMonth);
  return view.productsMarkup(entry, ctx.products, kind);
}
module.exports = {data, context, productBlock, view};
