import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { FEATURE_PAGES } from '../../features/workspace/data/workspace-pages';
import { WorkspacePortfolioContextService } from '../../features/workspace/services/workspace-portfolio-context.service';
import { PersistentAiChatComponent } from '../../shared/ai-copilot/components/persistent-ai-chat/persistent-ai-chat.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PersistentAiChatComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  protected readonly featurePages = FEATURE_PAGES;
  protected readonly portfolioContext = inject(WorkspacePortfolioContextService);

  protected changeActivePortfolio(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement | null)?.value;
    if (!selectedValue) {
      return;
    }

    this.portfolioContext.setSelectedPortfolio(selectedValue);
  }
}
