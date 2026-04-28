use clap::{Parser, Subcommand, ValueEnum};
use mini_copilot_core::Agent;
use std::path::PathBuf;

#[derive(Debug, Parser)]
#[command(about = "Mini Copilot-style agent demo")]
struct Args {
    #[arg(long, default_value = "examples/rust/fixtures/workspace")]
    workspace: PathBuf,

    #[arg(long, help = "Keep execution deterministic and offline")]
    dry_run: bool,

    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Ask {
        #[arg(required = true)]
        prompt: Vec<String>,
    },
    Demo {
        #[arg(value_enum)]
        kind: DemoKind,
    },
}

#[derive(Clone, Debug, ValueEnum)]
enum DemoKind {
    AgentLoop,
    Hooks,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    let agent = Agent::new(args.workspace)?;

    let prompt = match args.command {
        Command::Ask { prompt } => prompt.join(" "),
        Command::Demo {
            kind: DemoKind::AgentLoop,
        } => "Summarize the service status file".to_string(),
        Command::Demo {
            kind: DemoKind::Hooks,
        } => "Read service status and show hook trace".to_string(),
    };

    if args.dry_run {
        eprintln!("running mini-agent in deterministic dry-run mode");
    }

    let response = agent.ask(&prompt)?;
    println!("{}", serde_json::to_string_pretty(&response)?);

    Ok(())
}
