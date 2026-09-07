import { Message as I18nMessage } from "@gitbutler/i18n/react";
import type { FC } from "react";
import { AddProjectButton } from "#ui/components/AddProjectButton.tsx";
import { useAddLocalRepository } from "#ui/components/useAddLocalRepository.ts";
import { LiteTestId } from "#ui/testIds.ts";
import { LanguageSetting } from "#ui/LanguageSetting.tsx";
import styles from "./IndexPage.module.css";

export const IndexPage: FC = () => {
	const { addLocalRepository, isPending } = useAddLocalRepository();

	return (
		<section className={styles.page} data-testid={LiteTestId.OnboardingPage}>
			<h1>
				<I18nMessage value={{ key: "lite:IndexPage.welcomeToGitButlerLite" }} />
			</h1>
			<p>
				<I18nMessage value={{ key: "lite:IndexPage.addALocalGitRepositoryToGetStarted" }} />
			</p>
			<LanguageSetting />
			<AddProjectButton isPending={isPending} onClick={() => void addLocalRepository()} />
		</section>
	);
};
