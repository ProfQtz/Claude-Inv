import { Card, isRed, parseCards, SUIT_NAME, SUIT_SYMBOL, RANK_NAME } from "../poker/cards";

interface Props {
  card: Card;
  size?: "xs" | "sm" | "md";
  highlight?: boolean;
  dim?: boolean;
}

export function PlayingCard({ card, size = "md", highlight, dim }: Props) {
  const rank = card.rank === "T" ? "10" : card.rank;
  const classes = ["card", size, isRed(card) ? "red" : "black", highlight && "highlight", dim && "dim"];
  return (
    <div className={classes.filter(Boolean).join(" ")} role="img" aria-label={`${RANK_NAME[card.rank]} of ${SUIT_NAME[card.suit]}`}>
      <span className="card-index" aria-hidden="true">
        <span className="card-rank">{rank}</span>
        <span className="card-pip">{SUIT_SYMBOL[card.suit]}</span>
      </span>
      <span className="card-suit" aria-hidden="true">
        {SUIT_SYMBOL[card.suit]}
      </span>
    </div>
  );
}

interface RowProps {
  cards: string;
  size?: "sm" | "md";
  /** Card codes to highlight (e.g. the five that make the hand). */
  highlight?: Set<string>;
}

export function CardRow({ cards, size, highlight }: RowProps) {
  return (
    <div className="card-row">
      {parseCards(cards).map((c) => {
        const code = c.rank + c.suit;
        return (
          <PlayingCard
            key={code}
            card={c}
            size={size}
            highlight={highlight?.has(code)}
            dim={highlight !== undefined && !highlight.has(code)}
          />
        );
      })}
    </div>
  );
}

/** A face-down card. */
export function CardBack({ size = "md" }: { size?: "xs" | "sm" | "md" }) {
  return <div className={`card back ${size}`} role="img" aria-label="Hidden card" />;
}
