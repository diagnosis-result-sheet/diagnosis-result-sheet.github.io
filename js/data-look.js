/* イラストシート（顔・洋服の絵）で選べる部品と、タイプからの「おまかせ」の決め方
   架空の見本。一般的な考え方をもとにした「たたき台」で、診断士が自分の理論に合わせて変える前提。
   色コードは絵の「中身」なので、ここに直接書く（デザインルール D-35 の例外） */
window.DS = window.DS || {};
DS.data = DS.data || {};
DS.data.look = {
  /* 髪型（顔の絵に使う） */
  hairStyles: [
    { id: 'short', label: 'ショート' },
    { id: 'bob', label: 'ボブ' },
    { id: 'mid', label: 'ミディアム' },
    { id: 'long', label: 'ロング' },
    { id: 'updo', label: 'まとめ髪' }
  ],
  /* 顔タイプ診断の8タイプごとの、おまかせの髪型 */
  faceHair: {
    cute: 'bob', activecute: 'short', fresh: 'mid', coolcasual: 'short',
    feminine: 'long', softelegant: 'mid', elegant: 'updo', cool: 'bob'
  },
  /* 顔まわりの色（シーズンごとに足りないものだけ。リップ・チーク・髪・金属は js/data-pc.js の face を使う） */
  makeup: {
    spring: {
      eye: [['ピーチベージュ', '#E8B896'], ['コーラルブラウン', '#C98B6B'], ['ゴールドブラウン', '#B8863E']],
      nail: [['コーラル', '#F0806A'], ['ピーチ', '#F9B49A'], ['ミルキーベージュ', '#EBCFB5']]
    },
    summer: {
      eye: [['ローズベージュ', '#D9AFA8'], ['ラベンダー', '#B7A3C7'], ['グレイッシュピンク', '#C58FA0']],
      nail: [['ローズピンク', '#D77A93'], ['ピンクベージュ', '#E5BDB8'], ['ラベンダー', '#C6B3D6']]
    },
    autumn: {
      eye: [['ブロンズ', '#A87B4B'], ['テラコッタ', '#B5694A'], ['オリーブブラウン', '#8A7A4A']],
      nail: [['テラコッタ', '#B85C3C'], ['オレンジベージュ', '#D9A07A'], ['ブリック', '#9E3B2B']]
    },
    winter: {
      eye: [['シルバーグレー', '#A9A9B8'], ['ボルドー', '#7B3350'], ['ネイビー', '#34406E']],
      nail: [['ワインレッド', '#8E2344'], ['クールピンク', '#E07AA4'], ['ブルーグレー', '#9AA6C0']]
    }
  },
  /* 診断の種類を選んでいないときの色 */
  neutral: {
    hair: [['ブラウン', '#6B4A34'], ['ダークブラウン', '#432E22']],
    eye: [['ベージュ', '#D9B79B'], ['ブラウン', '#A9805F']],
    cheek: [['ピンクベージュ', '#EBB1A5']],
    lip: [['ローズベージュ', '#C97D72'], ['ピンクベージュ', '#D9A3A0']],
    nail: [['ベージュ', '#EBCFB5'], ['ピンク', '#E8A9A9']],
    metal: [['ゴールド', '#D4AF37'], ['シルバー', '#C0C0C0']],
    basics: [['ベージュ', '#E6D5BD'], ['グレー', '#B9B4AE'], ['ネイビー', '#34406E']],
    accents: [['ピンク', '#E49BA0'], ['ブルー', '#7DA7D9'], ['グリーン', '#8DBF9A']]
  },
  skin: { warm: '#F7DCC6', cool: '#F5DAD3' }, // 肌の色（シーズンの黄み・青みに合わせる）

  /* コーデの3つ（パンツ・スカート・ワンピース。あとから変えられる） */
  styles: [
    { id: 'pants', label: 'パンツ', title: 'パンツスタイル' },
    { id: 'skirt', label: 'スカート', title: 'スカートスタイル' },
    { id: 'dress', label: 'ワンピース', title: 'ワンピーススタイル' }
  ],
  defaultStyles: ['pants', 'skirt', 'dress'],

  /* 洋服の形。id は js/illust.js の絵と同じ */
  shapes: {
    outer: [['jacket', 'テーラードジャケット'], ['cardi', 'カーディガン'], ['longcardi', 'ロングカーディガン'], ['coat', 'ステンカラーコート']],
    top: [['vknit', 'Vネックのニット'], ['uknit', 'Uネックのカットソー'], ['boat', 'ボートネックのトップス'], ['square', 'スクエアネックのブラウス'],
      ['turtle', 'タートルネックのニット'], ['shirt', 'シャツ'], ['roundcollar', '丸襟のブラウス'], ['tee', 'Tシャツ']],
    pants: [['straight', 'ストレートパンツ'], ['wide', 'ワイドパンツ'], ['tapered', 'テーパードパンツ']],
    skirt: [['tight', 'タイトスカート'], ['aline', 'Aラインスカート'], ['flare', 'フレアスカート'], ['maxi', 'マキシ丈のスカート']],
    dress: [['shirtdress', 'シャツワンピース'], ['vdress', 'Vネックのワンピース'], ['boatdress', 'ボートネックのワンピース'],
      ['knitlong', 'ニットのロングワンピース'], ['girly', '丸襟のワンピース']],
    bag: [['hand', 'かっちりしたハンドバッグ'], ['shoulder', 'ショルダーバッグ'], ['tote', 'トートバッグ'], ['mini', 'ミニバッグ']],
    shoes: [['pumps', 'パンプス'], ['loafer', 'ローファー'], ['flat', 'バレエシューズ'], ['boots', 'ブーツ'], ['sneaker', 'スニーカー']]
  },
  slotLabel: { outer: 'アウター', top: 'トップス', pants: 'パンツ', skirt: 'スカート', dress: 'ワンピース', bag: 'バッグ', shoes: 'くつ' },

  /* 骨格タイプごとの、おまかせの形。top・outer・bag・shoes は [コーデ1, コーデ2, コーデ3] の順（outer はコーデ1は着ない） */
  byKokkaku: {
    straight: { top: ['vknit', 'shirt', 'uknit'], pants: 'straight', skirt: 'tight', dress: 'shirtdress', outer: [null, 'jacket', 'coat'], bag: ['hand', 'shoulder', 'hand'], shoes: ['pumps', 'loafer', 'pumps'] },
    wave: { top: ['boat', 'square', 'roundcollar'], pants: 'tapered', skirt: 'flare', dress: 'vdress', outer: [null, 'cardi', 'jacket'], bag: ['mini', 'shoulder', 'mini'], shoes: ['flat', 'pumps', 'flat'] },
    natural: { top: ['turtle', 'shirt', 'tee'], pants: 'wide', skirt: 'maxi', dress: 'knitlong', outer: [null, 'longcardi', 'coat'], bag: ['tote', 'tote', 'shoulder'], shoes: ['loafer', 'boots', 'sneaker'] }
  },
  fallbackKokkaku: 'straight'
};

/* 骨格タイプごとの「似合う服の一覧」（絵と、ひとこと説明）と、素材・柄の見本。
   lineup: [行の見出し, 部品の種類, [[形のid, 説明], ...]]。形の id は上の shapes と同じ。説明は短く、中学生にもわかる言葉で */
DS.data.look.kkNote = {
  straight: {
    feel: '体に厚みがあり、立体的。ハリのある素材と、すっきりした直線的な形が向いています。',
    lineup: [
      ['トップス', 'top', [['vknit', '胸元が縦に開いて、すっきり見える'], ['shirt', 'ハリのある襟つきで、上品に見える'], ['uknit', '深めに開いたUネックで、首まわりを軽く'], ['tee', '厚手のTシャツをジャストサイズで']]],
      ['ボトムス', 'bottom', [['pants:straight', 'まっすぐなパンツで、脚が長く見える'], ['pants:tapered', 'すそが細いと、全体が引きしまる'], ['skirt:tight', 'ひざ丈のタイトで、きれいめに'], ['skirt:aline', '広がりすぎないAラインなら、ほどよく女性らしい']]],
      ['アウター・ワンピース', 'mix', [['outer:jacket', 'かっちりしたジャケットが、いちばん映える'], ['outer:coat', 'ハリのあるコートで、縦のラインを作る'], ['dress:shirtdress', '飾りの少ないシャツワンピース'], ['dress:vdress', 'Vネックで胸元をすっきり']]],
      ['小物', 'acc', [['bag:hand', 'かっちりした革のバッグ'], ['bag:shoulder', 'ほどよい大きさの四角いバッグ'], ['shoes:pumps', 'つま先が細いパンプス'], ['shoes:loafer', 'シンプルなローファー']]]
    ],
    materials: [['ハリのあるコットン', 'plain', 'シャツ・パンツに。ハリがあると上品'], ['ウール（ギャバジン）', 'twill', 'しっかりした厚みで形がきれい'], ['カシミヤ', 'knit', '編み目が細かいと、すっきり'], ['厚手のシルク', 'sheer', 'ツヤがあり、重みがある'], ['表革のレザー', 'leather', 'バッグ・くつ・ジャケットに'], ['濃いめのデニム', 'denim', 'ハリがあり、きれいな形']],
    patterns: [['無地', 'plain', 'いちばん安心'], ['大きめのチェック', 'check-l', '柄が大きいほうが、なじむ'], ['太めのストライプ', 'stripe-l', '線が太いと、すっきり'], ['大きめの幾何学柄', 'geo', '大きく、はっきりした柄']]
  },
  wave: {
    feel: '体が薄く、華奢。やわらかく軽い素材と、ウエストを高く見せる形が向いています。',
    lineup: [
      ['トップス', 'top', [['boat', '首元が横に開いて、肩まわりがやさしく見える'], ['square', '鎖骨がきれいに見えるスクエア'], ['roundcollar', '丸襟とふくらんだそでで、華やかに'], ['uknit', '丈の短めなカットソーで、重心を上げる']]],
      ['ボトムス', 'bottom', [['pants:tapered', '丈の短めなパンツで、足首を見せる'], ['skirt:flare', 'ふんわり広がるスカートが、いちばん映える'], ['skirt:aline', '腰から広がるAラインで、バランスよく'], ['skirt:tight', '短めの丈なら、タイトも似合う']]],
      ['アウター・ワンピース', 'mix', [['outer:cardi', '短めのカーディガンで、ウエストを高く'], ['outer:jacket', '短め丈のジャケットをふんわり合わせる'], ['dress:vdress', 'ウエストの切りかえで、脚が長く見える'], ['dress:girly', '丸襟のワンピースで、女性らしく']]],
      ['小物', 'acc', [['bag:mini', '小ぶりなバッグが、体に合う'], ['bag:shoulder', '細いストラップのショルダー'], ['shoes:flat', 'バレエシューズで、やさしく'], ['shoes:pumps', 'ストラップつきのパンプス']]]
    ],
    materials: [['シフォン', 'sheer', 'やわらかく、軽く動く'], ['薄手のニット', 'knit', '細い糸で、やわらかく'], ['シルク・サテン', 'leather', 'ツヤのある素材で華やかに'], ['レース', 'tweed', '細かい模様が体になじむ'], ['ベロア', 'twill', '表面がやわらかくて、あたたかい'], ['薄手のデニム', 'denim', '軽く、やわらかいもの']],
    patterns: [['小花柄', 'floral-s', '小さな花が、いちばんなじむ'], ['小さめのドット', 'dot-s', '粒が小さいと、やさしい'], ['細いストライプ', 'stripe-s', '線が細いと、すっきり'], ['小さめのチェック', 'check-s', '細かいチェックで、きちんと']]
  },
  natural: {
    feel: '骨や関節がしっかりして、フレーム感がある。ゆったりした形と、ざっくりした天然素材が向いています。',
    lineup: [
      ['トップス', 'top', [['turtle', '首まわりにボリュームを出して、バランスよく'], ['shirt', '大きめのシャツを、ラフに着る'], ['tee', 'ゆったりしたTシャツで、こなれた感じに'], ['uknit', 'ゆとりのあるクルーネック']]],
      ['ボトムス', 'bottom', [['pants:wide', 'ワイドパンツで、ゆったり長く'], ['pants:straight', 'フルレングスのストレート'], ['skirt:maxi', 'マキシ丈のスカートで、縦長に'], ['skirt:flare', 'ひざ下まである、たっぷりしたスカート']]],
      ['アウター・ワンピース', 'mix', [['outer:longcardi', 'ロング丈で、重ね着のこなれ感を'], ['outer:coat', 'ゆったりしたロングコート'], ['dress:knitlong', 'ロング丈のニットワンピース'], ['dress:shirtdress', 'ロング丈のシャツワンピース']]],
      ['小物', 'acc', [['bag:tote', '大きめのトートバッグ'], ['bag:shoulder', '存在感のあるショルダー'], ['shoes:loafer', 'ざっくりしたローファー'], ['shoes:boots', 'ブーツで、ラフに']]]
    ],
    materials: [['麻（リネン）', 'linen', 'ざっくりした天然素材'], ['ざっくりしたニット', 'knit', '編み目の粗いものを'], ['ツイード', 'tweed', '表情のある素材'], ['コーデュロイ', 'twill', '太い畝のある素材'], ['ウォッシュ加工のデニム', 'denim', '使い込んだ風合い'], ['厚手のコットン', 'plain', 'ラフでゆったり']],
    patterns: [['大きめのチェック', 'check-l', '大きな柄が、体になじむ'], ['ボタニカル柄', 'floral-l', '大きな葉・花の柄'], ['太めのボーダー', 'border', '線が太く、ラフな雰囲気'], ['幾何学柄', 'geo', '大きく、はっきりした柄']]
  }
};
