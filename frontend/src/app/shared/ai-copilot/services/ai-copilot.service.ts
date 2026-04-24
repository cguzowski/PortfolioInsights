import { Injectable, signal } from '@angular/core';

export type AiChatTone = 'eli5' | 'hedge-fund';

export interface AiChatMessage {
  id: number;
  author: 'assistant' | 'user';
  text: string;
  timeLabel: string;
}

@Injectable({ providedIn: 'root' })
export class AiCopilotService {
  readonly quickPrompts: readonly string[] = [
    'What if oil spikes?',
    'Why is this portfolio down today?',
    'What would hurt this portfolio most?'
  ];

  private nextId = 1;
  private readonly _isOpen = signal(false);
  private readonly _tone = signal<AiChatTone>('hedge-fund');
  private readonly _draft = signal('');
  private readonly _messages = signal<AiChatMessage[]>([
    {
      id: this.nextId,
      author: 'assistant',
      text: 'I stay with you across every page. Ask me about risk, simulations, or portfolio construction ideas.',
      timeLabel: this.formatTime()
    }
  ]);

  readonly isOpen = this._isOpen.asReadonly();
  readonly tone = this._tone.asReadonly();
  readonly draft = this._draft.asReadonly();
  readonly messages = this._messages.asReadonly();

  toggleOpen(forceState?: boolean): void {
    if (typeof forceState === 'boolean') {
      this._isOpen.set(forceState);
      return;
    }

    this._isOpen.update((isOpen) => !isOpen);
  }

  setTone(tone: AiChatTone): void {
    this._tone.set(tone);
  }

  updateDraft(nextDraft: string): void {
    this._draft.set(nextDraft);
  }

  openWithPrompt(prompt: string): void {
    this._draft.set(prompt);
    this._isOpen.set(true);
  }

  sendDraft(): void {
    const question = this._draft().trim();
    if (!question) {
      return;
    }

    this.appendMessage('user', question);
    this._draft.set('');
    this._isOpen.set(true);
    this.appendMessage('assistant', this.generateMvpReply(question));
  }

  private appendMessage(author: AiChatMessage['author'], text: string): void {
    this.nextId += 1;
    this._messages.update((messages) => [
      ...messages,
      {
        id: this.nextId,
        author,
        text,
        timeLabel: this.formatTime()
      }
    ]);
  }

  private generateMvpReply(question: string): string {
    const normalized = question.toLowerCase();
    const tone = this._tone();

    if (normalized.includes('oil')) {
      return tone === 'eli5'
        ? 'Think of oil as fuel for many businesses. If oil rises fast, transport-heavy and consumer-sensitive names may feel pressure first.'
        : 'Oil upside shock: prioritize energy winners, trim transport and margin-sensitive cyclicals, and check inflation beta across the book.';
    }

    if (normalized.includes('rates') || normalized.includes('interest')) {
      return tone === 'eli5'
        ? 'Higher rates usually make borrowing harder, so expensive growth bets can wobble while cash-generating names hold up better.'
        : 'Higher-for-longer rates usually compress duration-heavy equities; rotate toward quality cash-flow and reprice debt-sensitive exposures.';
    }

    if (tone === 'eli5') {
      return 'Short answer: this is where we learn what pushes your portfolio up or down. We can wire real data into this flow next.';
    }

    return 'MVP framing: translate this into factor exposures, scenario shocks, and a ranked impact list. Current output is scaffold-ready for live models.';
  }

  private formatTime(): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  }
}
