/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Component } from "react";
import { defaultTextOptions } from "@lingdocs/pashto-inflector";
import { withRouter, Route, RouteComponentProps, Link } from "react-router-dom";
import Helmet from "react-helmet";
import BottomNavItem from "./components/BottomNavItem";
import SearchBar from "./components/SearchBar";
import DictionaryStatusDisplay from "./components/DictionaryStatusDisplay";
import About from "./screens/About";
import Options from "./screens/Options";
import Results from "./screens/Results";
import Account from "./screens/Account";
import ReviewTasks from "./screens/ReviewTasks";
import EntryEditor from "./screens/EntryEditor";
import IsolatedEntry from "./screens/IsolatedEntry";
import Wordlist from "./screens/Wordlist";
import { saveOptions, readOptions } from "./lib/options-storage";
import { dictionary, pageSize } from "./lib/dictionary";
import optionsReducer from "./lib/options-reducer";
import hitBottom from "./lib/hitBottom";
import getWordId from "./lib/get-word-id";
import { auth } from "./lib/firebase";
import { CronJob } from "cron";
import Mousetrap from "mousetrap";
import {
    sendSubmissions,
} from "./lib/submissions";
import { 
    loadUserInfo,
} from "./lib/backend-calls";
import * as BT from "./lib/backend-types";
import {
    getWordlist,
} from "./lib/wordlist-database";
import {
    wordlistEnabled,
} from "./lib/level-management";
import {
    deInitializeLocalDb,
    initializeLocalDb,
    startLocalDbSync,
    getLocalDbName,
    getAllDocsLocalDb,
} from "./lib/pouch-dbs";
import {
    forReview,
} from "./lib/spaced-repetition";
import {
    textBadge,
} from "./lib/badges";
import ReactGA from "react-ga";
// tslint:disable-next-line
import "@fortawesome/fontawesome-free/css/all.css";
import "./custom-bootstrap.scss";
// tslint:disable-next-line: ordered-imports
import "./App.css";
import classNames from "classnames";

// to allow Moustrap key combos even when input fields are in focus
Mousetrap.prototype.stopCallback = function () {
    return false;
}

const prod = document.location.hostname === "dictionary.lingdocs.com";

if (prod) {
    ReactGA.initialize("UA-196576671-1");
    ReactGA.set({ anonymizeIp: true });
}

const possibleLandingPages = [
    "/", "/about", "/settings", "/word", "/account", "/new-entries",
];
const editorOnlyPages = [
    "/edit", "/review-tasks",
];

class App extends Component<RouteComponentProps, State> {
    constructor(props: RouteComponentProps) {
        super(props);
        const savedOptions = readOptions();
        this.state = {
            dictionaryStatus: "loading",
            dictionaryInfo: undefined,
            options: savedOptions ? savedOptions : {
              language: "Pashto",
              searchType: "fuzzy",
              theme: /* istanbul ignore next */ (window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light",
              textOptions: defaultTextOptions,
              level: "basic",
              wordlistMode: "browse",
              wordlistReviewLanguage: "Pashto",
              wordlistReviewBadge: true,
              searchBarPosition: "top",
            },
            searchValue: "",
            page: 1,
            isolatedEntry: undefined,
            results: [],
            wordlist: [],
            reviewTasks: [],
        };
        this.handleOptionsUpdate = this.handleOptionsUpdate.bind(this);
        this.handleSearchValueChange = this.handleSearchValueChange.bind(this);
        this.handleIsolateEntry = this.handleIsolateEntry.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleGoBack = this.handleGoBack.bind(this);
        this.handleLoadUserInfo = this.handleLoadUserInfo.bind(this);
        this.handleRefreshWordlist = this.handleRefreshWordlist.bind(this);
        this.handleRefreshReviewTasks = this.handleRefreshReviewTasks.bind(this);
        this.handleDictionaryUpdate = this.handleDictionaryUpdate.bind(this);
    }

    public componentDidMount() {
        window.addEventListener("scroll", this.handleScroll);
        if (!possibleLandingPages.includes(this.props.location.pathname)) {
            this.props.history.replace("/");
        }
        if (prod && (this.state.options.level !== "editor")) {
            ReactGA.pageview(window.location.pathname + window.location.search);
        }
        dictionary.initialize().then((r) => {
            this.setState({
                dictionaryStatus: "ready",
                dictionaryInfo: r.dictionaryInfo,
            });
            // incase it took forever and timed out - might need to reinitialize the wordlist here ??
            if (wordlistEnabled(this.state)) {
                initializeLocalDb("wordlist", this.handleRefreshWordlist, auth.currentUser ? auth.currentUser.uid : undefined);
            }
            if (this.state.options.level === "editor") {
                initializeLocalDb("reviewTasks", this.handleRefreshReviewTasks);
            }
            if (this.props.location.pathname === "/word") {
                const wordId = getWordId(this.props.location.search);
                if (wordId) {
                    const word = dictionary.findOneByTs(wordId);
                    if (word) {
                        this.setState({ searchValue: word.p });
                    }
                    this.handleIsolateEntry(wordId);
                } else {
                    // TODO: Make a word not found screen
                    console.error("somehow had a word path without a word id param");
                    this.props.history.replace("/");
                }
            }
            if (this.props.location.pathname === "/new-entries") {
                this.setState({
                    results: dictionary.getNewWordsThisMonth(),
                    page: 1,
                });
            }
            if (r.response === "loaded from saved") {
                this.handleDictionaryUpdate();
            }
        }).catch((error) => {
            console.error(error);
            this.setState({ dictionaryStatus: "error loading" });
        });
        document.documentElement.setAttribute("data-theme", this.state.options.theme);
        /* istanbul ignore if */
        if (window.matchMedia) {
          const prefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
          prefersDarkQuery.addListener((e) => {
            if (e.matches) {
              this.handleOptionsUpdate({ type: "changeTheme", payload: "dark" });
            }
          });
          const prefersLightQuery = window.matchMedia("(prefers-color-scheme: light)");
          prefersLightQuery.addListener((e) => {
            if (e.matches) {
              this.handleOptionsUpdate({ type: "changeTheme", payload: "light" });
            }
          });
        }
        this.unregisterAuthObserver = auth.onAuthStateChanged((user) => {
            if (user) {
                if (wordlistEnabled(this.state)) {
                    initializeLocalDb("wordlist", this.handleRefreshWordlist, user.uid);
                }
                sendSubmissions();
                this.handleLoadUserInfo().catch(console.error);
                this.networkCronJob.stop();
                this.networkCronJob.start();
            } else {
                // signed out
                this.networkCronJob.stop();
                if (this.wordlistSync) {
                    this.wordlistSync.cancel();
                    this.wordlistSync = undefined;
                }
                if (this.reviewTastsSync) {
                    this.reviewTastsSync.cancel();
                    this.reviewTastsSync = undefined;
                }
                deInitializeLocalDb("wordlist");
                deInitializeLocalDb("reviewTasks");
                this.handleOptionsUpdate({ type: "changeUserLevel", payload: "basic" });
            }
            this.forceUpdate();
        });
        Mousetrap.bind(["ctrl+down", "ctrl+up", "command+down", "command+up"], (e) => {
            if (e.repeat) return;
            this.handleOptionsUpdate({ type: "toggleLanguage" });
        });
        Mousetrap.bind(["ctrl+b", "command+b"], (e) => {
            if (e.repeat) return;
            this.handleSearchValueChange("");
        });
        Mousetrap.bind(["ctrl+\\", "command+\\"], (e) => {
            if (e.repeat) return;
            if (this.state.options.level === "basic") return;
            if (this.props.location.pathname !== "/wordlist") {
                this.props.history.push("/wordlist");
            } else {
                this.handleGoBack();
            }
        });
    }

    public componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
        this.unregisterAuthObserver();
        this.networkCronJob.stop();
        if (this.wordlistSync) {
            this.wordlistSync.cancel();
        }
        if (this.reviewTastsSync) {
            this.reviewTastsSync.cancel();
        }
        Mousetrap.unbind(["ctrl+down", "ctrl+up", "command+down", "command+up"]);
        Mousetrap.unbind(["ctrl+b", "command+b"]);
        Mousetrap.unbind(["ctrl+\\", "command+\\"]);
    }

    public componentDidUpdate(prevProps: RouteComponentProps) {
        if (this.props.location.pathname !== prevProps.location.pathname) {
            if (prod && (this.state.options.level !== "editor")) {
                ReactGA.pageview(window.location.pathname + window.location.search);
            }
            if (this.props.location.pathname === "/") {
                this.handleSearchValueChange("");
            }
            if (this.props.location.pathname === "/new-entries") {
                this.setState({
                    results: dictionary.getNewWordsThisMonth(),
                    page: 1,
                });
            }
            if (editorOnlyPages.includes(this.props.location.pathname) && this.state.options.level !== "editor") {
                this.props.history.replace("/");
            }
        }
        if (getWordId(this.props.location.search) !== getWordId(prevProps.location.search)) {
            if (prod && (this.state.options.level !== "editor")) {
                ReactGA.pageview(window.location.pathname + window.location.search);
            }
            const wordId = getWordId(this.props.location.search);
            /* istanbul ignore else */
            if (wordId) {
                this.handleIsolateEntry(wordId, true);
            } else {
                this.setState({ isolatedEntry: undefined })
            }
        }
        // if (!["/wordlist", "/settings", "/review-tasks"].includes(this.props.location.pathname)) {
        //     window.scrollTo(0, 0);
        // }
    }

    private unregisterAuthObserver() {
        // will be filled in on mount
    }

    private wordlistSync: PouchDB.Replication.Sync<any> | undefined = undefined;
    private reviewTastsSync: PouchDB.Replication.Sync<any> | undefined = undefined;

    private async handleLoadUserInfo(): Promise<BT.CouchDbUser | undefined> {
        try {
            const userInfo = await loadUserInfo();
            const differentUserInfoLevel = userInfo && (userInfo.level !== this.state.options.level);
            const needToDowngrade = (!userInfo && wordlistEnabled(this.state));
            if (differentUserInfoLevel || needToDowngrade) {
                this.handleOptionsUpdate({
                    type: "changeUserLevel",
                    payload: userInfo ? userInfo.level : "basic",
                });
            }
            if (!userInfo) return undefined;
            // only sync wordlist for upgraded accounts
            if (userInfo && wordlistEnabled(userInfo.level)) {
                // TODO: GO OVER THIS HORRENDOUS BLOCK
                if (userInfo.level === "editor") {
                    initializeLocalDb("reviewTasks", this.handleRefreshReviewTasks);
                    if (!this.reviewTastsSync) {
                        this.reviewTastsSync = startLocalDbSync("reviewTasks", { name: userInfo.name, password: userInfo.userdbPassword });
                    }
                }
                const wordlistName = getLocalDbName("wordlist") ?? "";
                const usersWordlistInitialized = wordlistName.includes(userInfo.name);
                if (this.wordlistSync && usersWordlistInitialized) {
                    // sync already started for the correct db, don't start it again
                    return userInfo;
                }
                if (this.wordlistSync) {
                    this.wordlistSync.cancel();
                    this.wordlistSync = undefined;
                }
                if (!usersWordlistInitialized) {
                    initializeLocalDb("wordlist", this.handleRefreshWordlist, userInfo.name);
                }
                this.wordlistSync = startLocalDbSync("wordlist", { name: userInfo.name, password: userInfo.userdbPassword });
            }
            return userInfo;
        } catch (err) {
            console.error("error checking user level", err);
            // don't downgrade the level if it's editor/studend and offline (can't check user info)
            return undefined;
        }
    }

    private handleDictionaryUpdate() {
        dictionary.update(() => {
            this.setState({ dictionaryStatus: "updating" });
        }).then(({ dictionaryInfo }) => {
            this.setState({
                dictionaryStatus: "ready",
                dictionaryInfo,
            });
        }).catch(() => {
            this.setState({ dictionaryStatus: "error loading" });
        });
    }

    private handleOptionsUpdate(action: OptionsAction) {
        if (action.type === "changeTheme") {
            document.documentElement.setAttribute("data-theme", action.payload);
        }
        const options = optionsReducer(this.state.options, action);
        saveOptions(options);
        if (action.type === "toggleLanguage" || action.type === "toggleSearchType") {
            if (this.props.location.pathname !== "/new-entries") {
                this.setState(prevState => ({
                    options,
                    page: 1,
                    results: dictionary.search({ ...prevState, options }),
                }));
                window.scrollTo(0, 0);
            } else {
                this.setState({ options });
            }
        } else {
            this.setState({ options });
        }
    }

    private handleSearchValueChange(searchValue: string) {
        if (this.state.dictionaryStatus !== "ready") return;
        if (searchValue === "") {
            this.setState({
                searchValue: "",
                results: [],
                page: 1,
            });
            if (this.props.location.pathname !== "/") {
                this.props.history.replace("/");
            }
            return;
        }
        this.setState(prevState => ({
            searchValue,
            results: dictionary.search({ ...prevState, searchValue }),
            page: 1,
        }));
        if (this.props.history.location.pathname !== "/search") {
            this.props.history.push("/search");
        }
        window.scrollTo(0, 0);
    }

    private handleIsolateEntry(ts: number, onlyState?: boolean) {
        window.scrollTo(0, 0);
        const isolatedEntry = dictionary.findOneByTs(ts);
        if (!isolatedEntry) {
            console.error("couldn't find word to isolate");
            return;
        }
        this.setState({ isolatedEntry });

        if (!onlyState && (this.props.location.pathname !== "/word" || (getWordId(this.props.location.search) !== ts))) {
            this.props.history.push(`/word?id=${isolatedEntry.ts}`);
        }
    }

    private networkCronJob = new CronJob("1/5 * * * *", () => {
        // TODO: check for new dictionary (in a seperate cron job - not dependant on the user being signed in)
        this.handleLoadUserInfo();
        sendSubmissions();
        this.handleDictionaryUpdate();
    });

    /* istanbul ignore next */
    private handleScroll() {
        if (hitBottom() && this.props.location.pathname === "/search" && this.state.results.length >= (pageSize * this.state.page)) {
            const page = this.state.page + 1;
            const moreResults = dictionary.search({ ...this.state, page });
            if (moreResults.length > this.state.results.length) {
                this.setState({
                    page,
                    results: moreResults,
                });
            }
        }
    }

    private handleGoBack() {
        this.props.history.goBack();
        window.scrollTo(0, 0);
    }

    private handleRefreshWordlist() {
        getWordlist().then((wordlist) => {
            this.setState({ wordlist });
        });
    }

    private handleRefreshReviewTasks() {
        getAllDocsLocalDb("reviewTasks").then((reviewTasks) => {
            this.setState({ reviewTasks });
        });
    }

    render() {
        return <div style={{
            paddingTop: this.state.options.searchBarPosition === "top" ? "75px" : "7px",
            paddingBottom: "60px",    
        }}>
            <Helmet>
                <title>LingDocs Dictionary - Dev Branch</title>
            </Helmet>
                {this.state.options.searchBarPosition === "top" && <SearchBar
                    state={this.state}
                    optionsDispatch={this.handleOptionsUpdate}
                    handleSearchValueChange={this.handleSearchValueChange}
                />}
                <div className="container-fluid" data-testid="body">
                {this.state.dictionaryStatus !== "ready" ?
                    <DictionaryStatusDisplay status={this.state.dictionaryStatus} />
                :
                    <>
                        <Route path="/" exact>
                            <div className="text-center mt-4">
                                <h4 className="font-weight-light p-3 mb-4">LingDocs Pashto Dictionary</h4>
                                {this.state.options.searchType === "alphabetical" && <div className="mt-4 font-weight-light">
                                    <div className="mb-3"><span className="fa fa-book mr-2" ></span> Alphabetical browsing mode</div>
                                </div>}
                                {this.state.options.level === "editor" && <div className="mt-4 font-weight-light">
                                    <div className="mb-3">Editor priveleges active</div>
                                    <Link to="/edit">
                                        <button className="btn btn-secondary">New Entry</button>
                                    </Link>
                                </div>}
                                <Link to="/new-entries" className="plain-link font-weight-light">
                                    <div className="my-4">New words this month</div>
                                </Link>
                            </div>
                        </Route>
                        <Route path="/about">
                            <About state={this.state} />
                        </Route>
                        <Route path="/settings">
                            <Options options={this.state.options} optionsDispatch={this.handleOptionsUpdate} />
                        </Route>
                        <Route path="/search">
                            <Results state={this.state} isolateEntry={this.handleIsolateEntry} />
                        </Route>
                        <Route path="/new-entries">
                            <h4 className="mb-3">New Words This Month</h4>
                            {this.state.results.length ?
                                <Results state={this.state} isolateEntry={this.handleIsolateEntry} />
                            :
                                <div>No new words added this month 😓</div>
                            }
                        </Route>
                        <Route path="/account">
                            <Account level={this.state.options.level} loadUserInfo={this.handleLoadUserInfo} handleSignOut={(() => {
                                this.props.history.replace("/");
                                auth.signOut();
                            })} />
                        </Route>
                        <Route path="/word">
                            <IsolatedEntry
                                state={this.state}
                                dictionary={dictionary}
                                isolateEntry={this.handleIsolateEntry}
                            />
                        </Route>
                        {wordlistEnabled(this.state) && <Route path="/wordlist">
                            <Wordlist
                                state={this.state}
                                isolateEntry={this.handleIsolateEntry}
                                optionsDispatch={this.handleOptionsUpdate}
                            />
                        </Route>}
                        {this.state.options.level === "editor" && <Route path="/edit">
                            <EntryEditor
                                state={this.state}
                                dictionary={dictionary}
                                searchParams={new URLSearchParams(this.props.history.location.search)}
                            />
                        </Route>}
                        {this.state.options.level === "editor" && <Route path="/review-tasks">
                            <ReviewTasks state={this.state} />
                        </Route>}
                    </>
                }
            </div>
            <footer className={classNames(
                "footer",
                { "bg-white": !["/search", "/word"].includes(this.props.location.pathname) },
                { "footer-thick": this.state.options.searchBarPosition === "bottom" && !["/search", "/word"].includes(this.props.location.pathname) },
                { "wee-less-footer": this.state.options.searchBarPosition === "bottom" && ["/search", "/word"].includes(this.props.location.pathname) },
            )}>
                <Route path="/" exact>
                    <div className="buttons-footer">
                        <BottomNavItem label="About" icon="info-circle" page="/about" />
                        <BottomNavItem label="Settings" icon="cog" page="/settings" />
                        <BottomNavItem label={auth.currentUser ? "Account" : "Sign In"} icon="user" page="/account" />
                        {wordlistEnabled(this.state) &&
                            <BottomNavItem
                                label={`Wordlist ${this.state.options.wordlistReviewBadge ? textBadge(forReview(this.state.wordlist).length) : ""}`}
                                icon="list"
                                page="/wordlist"
                            />
                        }
                        {this.state.options.level === "editor" &&
                            <BottomNavItem
                                label={`Tasks ${textBadge(this.state.reviewTasks.length)}`}
                                icon="edit"
                                page="/review-tasks"
                            />
                        }
                    </div>
                </Route>
                <Route path={["/about", "/settings", "/new-entries", "/account", "/wordlist", "/edit", "/review-tasks"]}>
                    <div className="buttons-footer">
                        <BottomNavItem label="Home" icon="home" page="/" />
                    </div>
                </Route>
                {this.state.options.searchBarPosition === "bottom" && <SearchBar
                    state={this.state}
                    optionsDispatch={this.handleOptionsUpdate}
                    handleSearchValueChange={this.handleSearchValueChange}
                    onBottom
                />}
            </footer>
        </div>;
    }
}

export default withRouter(App);
