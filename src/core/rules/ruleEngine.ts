import { EventEmitter } from 'events';
import type {
	MailRule,
	MailRuleCondition,
	MailRuleAction,
	Mail,
} from '../../types/mail';

export class RuleEngine extends EventEmitter {
	private rules: Map<string, MailRule> = new Map();

	private jsRuleCache: Map<string, Function> = new Map();

	// constructor() {
	// 	super();
	// }

	// Rule Management
	addRule(rule: MailRule): void {
		this.rules.set(rule.id, rule);

		// Cache JavaScript rules for performance
		if (rule.conditions.type === 'javascript' && rule.conditions.jsCode) {
			try {
				const fn = new Function('mail', 'context', rule.conditions.jsCode);
				this.jsRuleCache.set(rule.id, fn);
			} catch (error) {
				console.error(`Failed to compile JavaScript rule ${rule.id}:`, error);
			}
		}

		this.emit('rule:added', rule);
	}

	removeRule(ruleId: string): void {
		const rule = this.rules.get(ruleId);
		if (rule) {
			this.rules.delete(ruleId);
			this.jsRuleCache.delete(ruleId);
			this.emit('rule:removed', rule);
		}
	}

	updateRule(ruleId: string, updates: Partial<MailRule>): void {
		const rule = this.rules.get(ruleId);
		if (rule) {
			const updatedRule = { ...rule, ...updates };
			this.rules.set(ruleId, updatedRule);

			// Update JS cache if needed
			if (
				updatedRule.conditions.type === 'javascript' &&
				updatedRule.conditions.jsCode
			) {
				try {
					const fn = new Function(
						'mail',
						'context',
						updatedRule.conditions.jsCode,
					);
					this.jsRuleCache.set(ruleId, fn);
				} catch (error) {
					console.error(`Failed to compile JavaScript rule ${ruleId}:`, error);
				}
			}

			this.emit('rule:updated', updatedRule);
		}
	}

	getRules(): MailRule[] {
		return Array.from(this.rules.values());
	}

	getRule(ruleId: string): MailRule | undefined {
		return this.rules.get(ruleId);
	}

	// Rule Application
	async applyRules(mail: Mail, context?: any): Promise<MailRuleAction[]> {
		const appliedActions: MailRuleAction[] = [];
		const enabledRules = Array.from(this.rules.values())
			.filter((rule) => rule.enabled)
			.sort((a, b) => a.priority - b.priority);

		for (const rule of enabledRules) {
			if (await this.evaluateCondition(mail, rule.conditions, context)) {
				appliedActions.push(...rule.actions);

				// Execute actions
				for (const action of rule.actions) {
					await this.executeAction(mail, action);
				}

				this.emit('rule:applied', { rule, mail, actions: rule.actions });

				// Stop processing if rule says so
				if (rule.stopProcessing) {
					break;
				}
			}
		}

		return appliedActions;
	}

	// Condition Evaluation
	private async evaluateCondition(
		mail: Mail,
		condition: MailRuleCondition,
		context?: any,
	): Promise<boolean> {
		switch (condition.type) {
			case 'simple':
				return this.evaluateSimpleCondition(mail, condition);

			case 'group':
				return this.evaluateGroupCondition(mail, condition, context);

			case 'javascript':
				return this.evaluateJavaScriptCondition(mail, condition, context);

			default:
				return false;
		}
	}

	private evaluateSimpleCondition(
		mail: Mail,
		condition: MailRuleCondition,
	): boolean {
		if (
			condition.type !== 'simple' ||
			!condition.field ||
			!condition.operator
		) {
			return false;
		}

		const fieldValue = this.getFieldValue(mail, condition.field);
		const compareValue = condition.value;

		switch (condition.operator) {
			case 'contains':
				return String(fieldValue)
					.toLowerCase()
					.includes(String(compareValue).toLowerCase());

			case 'equals':
				return fieldValue === compareValue;

			case 'startsWith':
				return String(fieldValue).startsWith(String(compareValue));

			case 'endsWith':
				return String(fieldValue).endsWith(String(compareValue));

			case 'regex':
				try {
					const regex = new RegExp(String(compareValue), 'i');
					return regex.test(String(fieldValue));
				} catch {
					return false;
				}

			case 'greaterThan':
				return Number(fieldValue) > Number(compareValue);

			case 'lessThan':
				return Number(fieldValue) < Number(compareValue);

			case 'in':
				return Array.isArray(compareValue) && compareValue.includes(fieldValue);

			case 'notIn':
				return (
					Array.isArray(compareValue) && !compareValue.includes(fieldValue)
				);

			default:
				return false;
		}
	}

	private evaluateGroupCondition(
		mail: Mail,
		condition: MailRuleCondition,
		context?: any,
	): boolean {
		if (condition.type !== 'group' || !condition.conditions) {
			return false;
		}

		const results = condition.conditions.map((cond) =>
			this.evaluateCondition(mail, cond, context),
		);

		switch (condition.operator) {
			case 'AND':
				return results.every((result) => result);

			case 'OR':
				return results.some((result) => result);

			case 'NOT':
				return !results[0];

			default:
				return false;
		}
	}

	private evaluateJavaScriptCondition(
		mail: Mail,
		condition: MailRuleCondition,
		context?: any,
	): boolean {
		if (condition.type !== 'javascript' || !condition.jsCode) {
			return false;
		}

		try {
			// Use cached function if available
			const fn =
				this.jsRuleCache.get(condition.jsCode) ||
				new Function('mail', 'context', condition.jsCode);

			return Boolean(fn(mail, context));
		} catch (error) {
			console.error('JavaScript rule evaluation error:', error);
			return false;
		}
	}

	private getFieldValue(mail: Mail, field: string): any {
		const paths = field.split('.');
		let value: any = mail;

		for (const path of paths) {
			if (value && typeof value === 'object') {
				value = value[path];
			} else {
				return undefined;
			}
		}

		return value;
	}

	// Action Execution
	private async executeAction(
		mail: Mail,
		action: MailRuleAction,
	): Promise<void> {
		this.emit('action:executing', { mail, action });

		switch (action.type) {
			case 'move':
				if (action.folderId) {
					mail.folderId = action.folderId;
				}
				break;

			case 'label':
				if (action.labelId && !mail.labels.includes(action.labelId)) {
					mail.labels.push(action.labelId);
				}
				break;

			case 'markRead':
				mail.isRead = true;
				break;

			case 'markImportant':
				mail.isImportant = true;
				break;

			case 'delete':
				mail.isDeleted = true;
				break;

			case 'forward':
				// Implement forwarding logic
				console.log(`Forward mail to: ${action.email}`);
				break;

			case 'notify':
				this.emit('notification:create', {
					mail,
					message:
						action.message ||
						`New mail from ${mail.from[0]?.name || mail.from[0]?.address}`,
				});
				break;

			case 'script':
				if (action.jsCode) {
					try {
						const fn = new Function('mail', 'action', action.jsCode);
						await fn(mail, action);
					} catch (error) {
						console.error('Script action error:', error);
					}
				}
				break;
		}

		this.emit('action:executed', { mail, action });
	}

	// Smart Categorization
	async categorizeMail(mail: Mail): Promise<string> {
		// Simple rule-based categorization
		// In real implementation, this would use ML model

		const subject = mail.subject.toLowerCase();
		const from = mail.from[0]?.address.toLowerCase() || '';

		if (from.includes('noreply') || from.includes('no-reply')) {
			return 'updates';
		}

		if (
			subject.includes('invoice') ||
			subject.includes('receipt') ||
			subject.includes('order') ||
			subject.includes('payment')
		) {
			return 'receipts';
		}

		if (subject.includes('newsletter') || from.includes('newsletter')) {
			return 'newsletters';
		}

		if (
			from.includes('github') ||
			from.includes('gitlab') ||
			from.includes('jira') ||
			from.includes('slack')
		) {
			return 'development';
		}

		if (
			from.includes('facebook') ||
			from.includes('twitter') ||
			from.includes('linkedin') ||
			from.includes('instagram')
		) {
			return 'social';
		}

		return 'primary';
	}

	// Import/Export
	exportRules(): string {
		const rules = Array.from(this.rules.values());
		return JSON.stringify(rules, null, 2);
	}

	importRules(rulesJson: string): void {
		try {
			const rules = JSON.parse(rulesJson) as MailRule[];

			// Clear existing rules
			this.rules.clear();
			this.jsRuleCache.clear();

			// Import new rules
			for (const rule of rules) {
				this.addRule(rule);
			}

			this.emit('rules:imported', rules.length);
		} catch (error) {
			console.error('Failed to import rules:', error);
			throw new Error('Invalid rules format');
		}
	}

	// Cleanup
	destroy(): void {
		this.rules.clear();
		this.jsRuleCache.clear();
		this.removeAllListeners();
	}
}

// Export singleton instance
export const ruleEngine = new RuleEngine();
