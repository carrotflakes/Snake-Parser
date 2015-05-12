# Snake Parser

JavaScript製のパーサジェネレータです。

https://carrotflakes.github.io/Snake-Parser/

## 特徴
- PEGのような文法記述
- 左再帰に対応
- パーサはJavaScriptの関数として出力

## 文法記述例
次の文法は `+` と `*` と整数を使った数式を計算する関数を生成します。
`1+2*3` を入力すると `7` が出力されることを期待します。

```
// モディファイア定義
{
  additive: function($) {
    return $.left + $.right;
  },
  multiplicative: function($) {
    return $.left * $.right;
  },
  integer: function($) {
    return +$;
  }
}

// ルール定義
start =
  additive

additive =
  {left:multiplicative "+" right:additive}>additive
  | multiplicative

multiplicative =
  {left:primary "*" right:multiplicative}>multiplicative
  | primary

primary =
  integer
  | "(" additive ")"

integer =
  `+[0-9]>integer
```

## 文法記述法
### 基本
文法は以下のように記述します。

```
// モディファイアの定義
{
  modifier1: function($) {
	  return ...;
	},
	...
}

// ルールの定義
start = rule1

rule1 = ...
```

最初にモディファイアを定義します。関数を格納したオブジェクトのように書きます。モディファイアが不要であれば `{}` ごと省略することができます。
次にルールを `ルール名 = パージング表現` の形で定義します。ルール名は `[a-zA-Z_][a-zA-Z0-9_]*` の正規表現を満たすものが使えます。`start` は最初に呼び出されるルールです。
文法記述の中にはJavaScriptのようにコメントを書き込むこともできます。

### パージング表現
[TODO]

#### マッチング
    'A'
    "A"
文字列 `A` にマッチします。

    [A]
文字の集合を表します。 `[]` で囲まれた文字のいずれかにマッチします。
例えば、 `[abcd]` は `a` `b` `c` `d` のいずれかの文字にマッチします。
また `[abcdf]` は `[a-df]` のように書くことが可能です。

    [^A]
`[A]` にマッチしない文字にマッチします。

    .
任意の1文字にマッチします。

#### 量化
    ?A
パージング表現 `A` のパースに成功すればこのパースは成功ですが、そうでなくても成功になります。

    *A
パージング表現 `A` を失敗するまで繰り返します。

    +A
パージング表現 `A` を失敗するまで繰り返します。１回以上成功しないとこのパースは失敗になります。

    n*A
`A` を `n` 回繰り返したものと同値です。

    n,m*A
パージング表現 `A` を失敗するまで繰り返します。成功回数が `n` から `m`
ならばこのパースは成功です。

#### 制御
    A
ルール `A` でパースします。

    &A
パージング表現 `A` でパースします。パースに成功してもポインタを進めません。

    !
パージング表現 `A` でパースを試み、成功すればこのパースは失敗です。失敗すればこのパースは成功になります。

    A|B
パージング表現 `A` でパースします。それが失敗ならば、 パージング表現 `B` でパースをします。

    A B
パージング表現 `A` でパースします。それが成功すれば、次にパージング表現 `B` でパースをします。

    (...)
括弧の中をひとまとまりに扱います

#### 返り値
    `A
`A` でマッチした文字列を返り値とします。

    {...}
括弧内の `A:B` や `A:=B` を要素とするオブジェクトを返り値にします。

    A:B
`{...}` によってオブジェクトが作られるとき、パージング表現 `B` の返り値を、文字列 `A` をキーとしてオブジェクトに格納します。

    A:=B
`{...}` によってオブジェクトが作られるとき、文字列 `B` を、文字列 `A` をキーとしてオブジェクトに格納します。

    @A
パージング表現 `A` の中では複数の返り値 を返すことを許可します。その複数の返り値を1つの配列として返り値にします。

    A>M
`M` はモディファイア名です。パージング表現 `A` の返り値をモディファイア `M` で加工して返り値とします。

    A>{E}
[TODO]

    \123
    \"Hello"
    \true
    \null
numeric や string 、 boolean 、 null などの値をそのまま返り値とします。

#### その他
    $ptr
    $src
    $line
    $column
未実装[TODO]
