# External Markdown Visual Evaluation

> One deterministic MDPR rule path converts 20+ downloaded Markdown documents into editable PPTX slides.

## Runtime Boundary

- **MDPR**
  Parses Markdown, keeps graphs whole, selects layouts, applies theme colors, renders PPTX, and validates overflow.
- **mdpr-skill**
  Collects evidence and may add review notes, but does not choose final coordinates, colors, typography, or object geometry.
- **Evaluation target**
  Compare generated slides against research/product teaser expectations: clear focal message, hierarchy, restrained contrast, and bounded text.

## Unified Pipeline

Downloaded Markdown => MDPR Parser => Slide Splitter => Layout Planner => PPTX Renderer => PNG Visual QA => Improvement Notes

## Teaser Rubric

| Criterion | Requirement | Failure Signal |
| --- | --- | --- |
| Focal message | One readable headline and primary object | no dominant title or all-text wall |
| Hierarchy | title >= section >= body; proof objects carry emphasis | tiny title or random accents |
| Coherence | same-rule layouts across every source | per-source manual styling |
| Boundaries | text and shapes stay inside slide and parent boxes | overflow or clipped rows |
| Teaser quality | resembles a paper/product teaser in density and polish | blank, generic, or palette-only output |

## Iteration Plan

- Current pass: iteration 2 of 4.
- All passes use the same MDPR parser, layout planner, PPTX renderer, and visual validation path.
- The corpus is one combined deck, not a set of hand-tuned per-file decks.

## Feedback Applied

- Convert long imported paragraphs into bounded executive bullets before MDPR layout.
- Keep source identity as section context, not as large decorative badges.
- Preserve tables, code fences, and pipeline syntax so MDPR can choose the right object family.

## 01. React

- **Source**
  `react` from `https://raw.githubusercontent.com/facebook/react/main/README.md`
- **Structure**
  9 headings, 0 table-like lines, 1 fenced code blocks.
- Use Quick Start to get a taste of React.
- Add React to an Existing Project to use as little or as much React as you need.
- Create a New React App if you're looking for a powerful JavaScript toolchain.
- Adding Interactivity
- Where to Get Support

## 02. Vite

- **Source**
  `vite` from `https://raw.githubusercontent.com/vitejs/vite/main/README.md`
- **Structure**
  5 headings, 5 table-like lines, 0 fenced code blocks.
- Instant Server Start
- Universal Plugin Interface
- A dev server that provides rich feature enhancements over native ES modules, for example extremely fast Hot Module Replacement (HMR).
- A build command that bundles your code with Rolldown, pre-configured to output highly optimized static assets for production.

### Representative Table

| Package | Version (click for changelogs) |
| ------------------------------------------ | :----------------------------------------- |
| vite |  |
| @vitejs/plugin-legacy |  |
| create-vite |  |

## 03. vuejs/core

- **Source**
  `vue` from `https://raw.githubusercontent.com/vuejs/core/main/README.md`
- **Structure**
  8 headings, 0 table-like lines, 0 fenced code blocks.
- Vue.js is an MIT-licensed open source project with its ongoing development made possible entirely by the support of these awesome backers. If you'd like to join them, please consider sponsoring Vue's developmen
- For questions and support please use the official forum or community chat. The issue list of this repo is **exclusively** for bug reports and feature requests.
- Please make sure to respect issue requirements and use the new issue helper when opening an issue. Issues not conforming to the guidelines may be closed immediately.

## 04. Svelte

- **Source**
  `svelte` from `https://raw.githubusercontent.com/sveltejs/svelte/main/README.md`
- **Structure**
  6 headings, 0 table-like lines, 0 fenced code blocks.
- Becoming a backer on Open Collective.

## 05. TypeScript

- **Source**
  `typescript` from `https://raw.githubusercontent.com/microsoft/TypeScript/main/README.md`
- **Structure**
  5 headings, 0 table-like lines, 2 fenced code blocks.
- Crashes that were introduced in 5.9 or 6.0 that *also* repro in 7.0 *and* have a portable fix *and* don't incur other behavioral changes
- Language service crashes that substantially impact mainline usage
- Serious regressions from 5.9 (these must *seriously* impact a *large* proportion of users)
- Submit bugs and help us verify fixes as they are checked in.
- Review the source code changes.

## 06. Node.js

- **Source**
  `node` from `https://raw.githubusercontent.com/nodejs/node/main/README.md`
- **Structure**
  17 headings, 0 table-like lines, 3 fenced code blocks.
- Current and LTS releases
- Contributing to Node.js
- Current project team members
- TSC (Technical Steering Committee)
- ****Current****
  Under active development. Code for the Current release is in the

## 07. Express

- **Source**
  `express` from `https://raw.githubusercontent.com/expressjs/express/master/Readme.md`
- **Structure**
  14 headings, 0 table-like lines, 11 fenced code blocks.
- Current project team members
- TC (Technical Committee)
- Focus on high performance
- Super-high test coverage
- View system supporting 14+ template engines

## 08. FastAPI

- **Source**
  `fastapi` from `https://raw.githubusercontent.com/fastapi/fastapi/master/README.md`
- **Structure**
  28 headings, 0 table-like lines, 12 fenced code blocks.
- ****Fast****
  Very high performance, on par with **NodeJS** and **Go** (thanks to Starlette and Pydantic). One of the fastest Python frameworks available.
- ****Fast to code****
  Increase the speed to develop features by about 200% to 300%. *
- ****Fewer bugs****
  Reduce about 40% of human (developer) induced errors. *
- ****Intuitive****
  Great editor support. Completion everywhere. Less time debugging.
- ****Easy****
  Designed to be easy to use and learn. Less time reading docs.

## 09. OpenAI Python API library

- **Source**
  `openai-python` from `https://raw.githubusercontent.com/openai/openai-python/main/README.md`
- **Structure**
  48 headings, 10 table-like lines, 42 fenced code blocks.
- Serializing back into JSON, model.to_json()
- Converting to a dictionary, model.to_dict()
- Additional advanced functionality
- azure_endpoint (or the AZURE_OPENAI_ENDPOINT environment variable)
- api_version (or the OPENAI_API_VERSION environment variable)

### Representative Table

| Status Code | Error Type |
| ----------- | -------------------------- |
| 400 | BadRequestError |
| 401 | AuthenticationError |
| 403 | PermissionDeniedError |
| 404 | NotFoundError |

## 10. LangChain

- **Source**
  `langchain` from `https://raw.githubusercontent.com/langchain-ai/langchain/master/README.md`
- **Structure**
  4 headings, 0 table-like lines, 2 fenced code blocks.
- **Deep Agents** Build agents that can plan, use subagents, and leverage file systems for complex tasks
- **LangGraph** Build agents that can reliably handle complex tasks with our low-level agent orchestration framework
- **Integrations** Chat & embedding models, tools & toolkits, and more
- **LangSmith** Agent evals, observability, and debugging for LLM apps
- **LangSmith Deployment** Deploy and scale agents with a purpose-built platform for long-running, stateful workflows

## 11. Playwright

- **Source**
  `playwright` from `https://raw.githubusercontent.com/microsoft/playwright/main/README.md`
- **Structure**
  22 headings, 12 table-like lines, 22 fenced code blocks.
- heading "todos" [level=1]
- textbox "What needs to be done?" [ref=e5]
- checkbox "Toggle Todo" [ref=e10]
- **text**
  "Buy groceries"
- CLI for coding agents

### Representative Table

|  | Best for | Install |
| --- | --- | --- |
| **Playwright Test** | End-to-end testing | npm init playwright@latest |
| **Playwright CLI** | Coding agents (Claude Code, Copilot) | npm i -g @playwright/cli@latest |
| **Playwright MCP** | AI agents and LLM-driven automation | npx @playwright/mcp@latest |
| **Playwright Library** | Browser automation scripts | npm i playwright |

## 12. Tailwind CSS

- **Source**
  `tailwindcss` from `https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/README.md`
- **Structure**
  3 headings, 0 table-like lines, 0 fenced code blocks.
- A utility-first CSS framework for rapidly building custom user interfaces.
- If you're interested in contributing to Tailwind CSS, please read our contributing docs **before submitting a pull request**.

## 13. Kubernetes (K8s)

- **Source**
  `kubernetes` from `https://raw.githubusercontent.com/kubernetes/kubernetes/master/README.md`
- **Structure**
  8 headings, 0 table-like lines, 2 fenced code blocks.
- Kubernetes, also known as K8s, is an open source system for managing [containerized applications] across multiple hosts. It provides basic mechanisms for the deployment, maintenance, and scaling of applications
- Kubernetes builds upon a decade and a half of experience at Google running production workloads at scale using a system called [Borg], combined with best-of-breed ideas and practices from the community.
- Kubernetes is hosted by the Cloud Native Computing Foundation ([CNCF]). If your company wants to help shape the evolution of technologies that are container-packaged, dynamically scheduled, and microservices-or

## 14. Rust

- **Source**
  `rust` from `https://raw.githubusercontent.com/rust-lang/rust/master/README.md`
- **Structure**
  7 headings, 0 table-like lines, 0 fenced code blocks.
- ****Performance**
  ** Fast and memory-efficient, suitable for critical services, embedded devices, and easily integrated with other languages.
- ****Reliability**
  ** Our rich type system and ownership model ensure memory and thread safety, reducing bugs at compile-time.

## 15. if you are updating an existing checkout

- **Source**
  `pytorch` from `https://raw.githubusercontent.com/pytorch/pytorch/main/README.md`
- **Structure**
  33 headings, 8 table-like lines, 22 fenced code blocks.
- Tensor computation (like NumPy) with strong GPU acceleration
- Deep neural networks built on a tape-based autograd system
- A GPU-Ready Tensor Library
- **Dynamic Neural Networks**
  Tape-Based Autograd
- Imperative Experiences

### Representative Table

| Component | Description |
| ---- | --- |
| **torch** | A Tensor library like NumPy, with strong G |
| **torch.autograd** | A tape-based automatic differentiation lib |
| **torch.jit** | A compilation stack (TorchScript) to creat |
| **torch.nn** | A neural networks library deeply integrate |

## 16. TensorFlow

- **Source**
  `tensorflow` from `https://raw.githubusercontent.com/tensorflow/tensorflow/master/README.md`
- **Structure**
  8 headings, 0 table-like lines, 4 fenced code blocks.
- Clone the TensorFlow repository and switch to the appropriate branch for
- Apply the desired changes (i.e., cherry-pick them) and resolve any code
- Run TensorFlow tests and ensure they pass.
- Build the TensorFlow pip
- TensorFlow Tutorials

### Representative Table

| **Documentation** |
| ------------------- |
|  |

## 17. pandas: A Powerful Python Data Analysis Toolkit

- **Source**
  `pandas` from `https://raw.githubusercontent.com/pandas-dev/pandas/main/README.md`
- **Structure**
  15 headings, 5 table-like lines, 5 fenced code blocks.
- Installation from sources
- Discussion and Development
- Contributing to pandas
- Easy handling of [**missing data**][missing-data] (represented as
- **Size mutability**
  columns can be [**inserted and

### Representative Table

|  |  |
| --- | --- |
| Testing |  |
| Package |  |
| Meta |  |

## 18. NumPy

- **Source**
  `numpy` from `https://raw.githubusercontent.com/numpy/numpy/main/README.md`
- **Structure**
  0 headings, 0 table-like lines, 0 fenced code blocks.
- ****Website**
  ** https://numpy.org
- ****Documentation**
  ** https://numpy.org/doc
- ****Mailing list**
  ** https://mail.python.org/mailman/listinfo/numpy-discussion
- ****Source code**
  ** https://github.com/numpy/numpy
- ****Contributing**
  ** https://numpy.org/devdocs/dev/index.html

## 19. venv

- **Source**
  `huggingface-transformers` from `https://raw.githubusercontent.com/huggingface/transformers/main/README.md`
- **Structure**
  13 headings, 0 table-like lines, 10 fenced code blocks.
- High performance on natural language understanding & generation, computer vision, audio, video, and multimodal tasks.
- Low barrier to entry for researchers, engineers, and developers.
- Few user-facing abstractions with just three classes to learn.
- A unified API for using all our pretrained models.
- Share trained models instead of training from scratch.

### Representative Table

| English |
|  |
|  |
|  |
| Espa ol |
|  |

## 20. D3: Data-Driven Documents

- **Source**
  `d3` from `https://raw.githubusercontent.com/d3/d3/main/README.md`
- **Structure**
  2 headings, 0 table-like lines, 0 fenced code blocks.
- **D3** (or **D3.js**) is a free, open-source JavaScript library for visualizing data. Its low-level approach built on web standards offers unparalleled flexibility in authoring dynamic, data-driven graphics. Fo

## 21. Apache ECharts

- **Source**
  `echarts` from `https://raw.githubusercontent.com/apache/echarts/master/README.md`
- **Structure**
  19 headings, 0 table-like lines, 1 fenced code blocks.
- Apache ECharts is a free, powerful charting and visualization library offering easy ways to add intuitive, interactive, and highly customizable charts to your commercial products. It is written in pure JavaScri
- + Download from the official website + npm install echarts --save + CDN: jsDelivr CDN
- + GitHub Issues for bug report and feature requests + Email dev@echarts.apache.org for general questions + Subscribe to the mailing list to get updated with the project

## 22. plotly.py

- **Source**
  `plotly` from `https://raw.githubusercontent.com/plotly/plotly.py/master/README.md`
- **Structure**
  8 headings, 0 table-like lines, 9 fenced code blocks.
- Online Documentation
- Contributing to plotly

## 23. The System Design Primer

- **Source**
  `system-design-primer` from `https://raw.githubusercontent.com/donnemartin/system-design-primer/master/README.md`
- **Structure**
  112 headings, 132 table-like lines, 9 fenced code blocks.
- How to approach a system design interview question
- System design interview questions, **with solutions**
- Object-oriented design interview questions, **with solutions**
- Additional system design interview questions
- System design exercises deck

### Representative Table

|  | Short | Medium | Long |
| --- | --- | --- | --- |
| Read through the System design topics to g | :+1: | :+1: | :+1: |
| Read through a few articles in the Company | :+1: | :+1: | :+1: |
| Read through a few Real world architecture | :+1: | :+1: | :+1: |
| Review How to approach a system design int | :+1: | :+1: | :+1: |
