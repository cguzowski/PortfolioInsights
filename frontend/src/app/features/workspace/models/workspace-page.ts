export interface WorkspaceFeatureCard {
  title: string;
  context: string;
  details: readonly string[];
  mvpNote: string;
}

export interface WorkspacePage {
  id: string;
  route: string;
  navLabel: string;
  navHint: string;
  cards: readonly WorkspaceFeatureCard[];
  chatCallout: string;
  chatPrompts: readonly string[];
}
