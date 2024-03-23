import axios from "axios";
import { load } from "cheerio";
import fs from "fs";

const url =
  "https://bulbapedia.bulbagarden.net/wiki/List_of_Battle_Tree_Pok%C3%A9mon";

function getEvs({
  hp,
  atk,
  def,
  spa,
  spd,
  spe,
}: {
  hp: string;
  atk: string;
  def: string;
  spa: string;
  spd: string;
  spe: string;
}) {
  const hp_display = hp != "-" ? `${hp} HP` : undefined;
  const atk_display = atk != "-" ? `${atk} Atk` : undefined;
  const def_display = def != "-" ? `${def} Def` : undefined;
  const spa_display = spa != "-" ? `${spa} SpA` : undefined;
  const spd_display = spd != "-" ? `${spd} SpD` : undefined;
  const spe_display = spe != "-" ? `${spe} Spe` : undefined;

  const evs = [
    hp_display,
    atk_display,
    def_display,
    spa_display,
    spd_display,
    spe_display,
  ];

  return evs.filter(Boolean).join(" / ");
}

axios
  .get(url)
  .then(async (response) => {
    const $ = load(response.data);
    const pokemons: {
      name: string;
      level: number;
      nature: string;
      ability: string;
      evs: string;
      moves: string[];
    }[] = [];

    let i = 1;
    for (const el of $("tbody").children().toArray().slice(2)) {
      const tableInfos = $(el).children();
      const name = $($(tableInfos.get(2)).children().get(0)).text();
      const item = $($(tableInfos.get(3)).children().get(1)).text();
      const firstMove = $(
        $(
          $($(tableInfos.get(4)))
            .children()
            .get(0),
        )
          .children()
          .get(0),
      ).text();
      const secondMove = $(
        $(
          $($(tableInfos.get(5)))
            .children()
            .get(0),
        )
          .children()
          .get(0),
      ).text();
      const thirdMove = $(
        $(
          $($(tableInfos.get(6)))
            .children()
            .get(0),
        )
          .children()
          .get(0),
      ).text();
      const fourthMove = $(
        $(
          $($(tableInfos.get(7)))
            .children()
            .get(0),
        )
          .children()
          .get(0),
      ).text();
      const nature = $(tableInfos.get(8)).text().trim();
      const hp = $(tableInfos.get(9)).text().trim();
      const attack = $(tableInfos.get(10)).text().trim();
      const defense = $(tableInfos.get(11)).text().trim();
      const spa = $(tableInfos.get(12)).text().trim();
      const spd = $(tableInfos.get(13)).text().trim();
      const spe = $(tableInfos.get(14)).text().trim();

      const res = await axios.get(
        `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(name)}_(Pok%C3%A9mon)`,
      );
      const p$ = load(res.data);
      const ability = p$(
        p$(
          p$(
            p$(
              p$(
                p$(
                  p$(p$(p$("table.roundy > tbody").get(0)).children().get(2))
                    .children()
                    .get(0),
                )
                  .children()
                  .get(1),
              )
                .children()
                .get(0),
            )
              .children()
              .get(0),
          )
            .children()
            .get(0),
        )
          .find("a")
          .get(0),
      ).text();
      const megaTable = p$(
        p$(
          p$(
            p$(
              p$(p$(p$("table.roundy > tbody").get(0)).children().get(2))
                .children()
                .get(0),
            )
              .children()
              .get(1),
          )
            .children()
            .get(0),
        )
          .children()
          .get(1),
      );
      const poke = {
        name: `${name} @ ${item}`,
        level: 50,
        nature: `${nature} Nature`,
        ability: ability,
        evs: getEvs({
          hp,
          atk: attack,
          def: defense,
          spa,
          spd,
          spe,
        }),
        moves: [firstMove, secondMove, thirdMove, fourthMove],
      };
      pokemons.push(poke);
      console.log(`${i}. ${poke.name}`);
      i++;
      if (megaTable.length != 0) {
        poke.name = `${name}-Mega @ ${item}`;
        poke.ability = p$(
          p$(megaTable.children().get(0)).find("span").get(0),
        ).text();
        pokemons.push(poke);
        console.log(`${i}. ${poke.name}`);
        i++;
      }
    }
    fs.appendFile(
      "pokemons.txt",
      pokemons
        .map(
          (pokemon) =>
            `${pokemon.name}\nLevel: ${pokemon.level}\n${pokemon.nature}\nAbility: ${pokemon.ability}\n${pokemon.evs}\n${pokemon.moves.map((move) => `- ${move}`).join("\n")}`,
        )
        .join("\n\n"),
      (err) => {
        if (err) console.error(err);
      },
    );
  })
  .catch((error) => {
    console.error(error);
  });
