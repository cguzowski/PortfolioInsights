import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AiChatTone, AiCopilotService } from '../../services/ai-copilot.service';

@Component({
  selector: 'app-persistent-ai-chat',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './persistent-ai-chat.component.html',
  styleUrl: './persistent-ai-chat.component.css'
})
export class PersistentAiChatComponent {
  protected readonly copilot = inject(AiCopilotService);

  protected toggleChat(): void {
    this.copilot.toggleOpen();
  }

  protected setTone(tone: AiChatTone): void {
    this.copilot.setTone(tone);
  }

  protected usePrompt(prompt: string): void {
    this.copilot.openWithPrompt(prompt);
  }

  protected sendMessage(): void {
    this.copilot.sendDraft();
  }
}
