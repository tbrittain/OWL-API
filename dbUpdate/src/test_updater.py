import os
import pandas as pd
import pytest
import updater
import utils

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_csv_files_present_in_parent_dir():
    """Matches and players CSV files are present"""
    assert os.path.isfile(f'{base_dir}\\matches.csv'), "matches CSV must be present"
    assert os.path.isfile(f'{base_dir}\\players.csv'), "players CSV must be present"


def test_csv_files_contain_required_columns():
    """Required columns are present in matches.csv"""
    # matches.csv
    matches = pd.read_csv(f'{base_dir}\\matches.csv')
    existing_columns = list(matches.columns)
    required_columns = ['round_start_time', 'round_end_time', 'year', 'stage', 'playoffs', 'postseason', 'match_id',
                        'game_number', 'match_winner', 'map_winner', 'map_loser', 'map_name', 'map_type', 'map_round',
                        'winning_team_final_map_score', 'losing_team_final_map_score', 'control_round_name', 'attacker',
                        'defender', 'attacker_payload_distance', 'defender_payload_distance', 'attacker_time_banked',
                        'defender_time_banked', 'attacker_control_perecent', 'defender_control_perecent',  # these are
                        # typos from the original OWL data...
                        'attacker_round_end_score', 'defender_round_end_score']
    for column_name in required_columns:
        assert column_name in existing_columns, f"column {column_name} must be present"

    # players.csv
    players = pd.read_csv(f'{base_dir}\\players.csv')
    existing_columns = list(players.columns)
    required_columns = ['round_start_time', 'match_id', 'player', 'team', 'stat_name', 'hero', 'stat_amount']

    for column_name in required_columns:
        assert column_name in existing_columns, f"column {column_name} must be present"


def test_load_csv_files_as_pandas_df():
    matches_df = updater.load_csv_to_df(file_path=f'{base_dir}\\matches.csv')
    assert matches_df.count()[0] > 0, "Rows present in matches dataframe"

    players_df = updater.load_csv_to_df(file_path=f'{base_dir}\\players.csv')
    assert players_df.count()[0] > 0, "Rows present in players dataframe"


@pytest.fixture(scope="function")
def db_connection_class():
    """Connect to database through Database Connection object"""
    db = utils.DatabaseConnection()

    yield db

    db.rollback()
    db.terminate()


def test_truncate_df_after_most_recent_match_date(db_connection_class):
    match_path = f'{base_dir}\\matches.csv'
    players_path = f'{base_dir}\\players.csv'

    raw_match_df = updater.load_csv_to_df(file_path=match_path)
    raw_players_df = updater.load_csv_to_df(file_path=players_path)

    db = db_connection_class
    most_recent_match = db.get_most_recent_match_timestamp()

    truncated_match_df = updater.truncate_df_after_date(date=most_recent_match,
                                                        file_path=match_path)
    truncated_players_df = updater.truncate_df_after_date(date=most_recent_match,
                                                          file_path=players_path)

    assert raw_match_df.count()[0] > truncated_match_df.count()[0], "Raw matches dataframe larger than truncated " \
                                                                    "dataframe"
    assert raw_players_df.count()[0] > truncated_players_df.count()[0], "Raw matches dataframe larger than truncated " \
                                                                        "dataframe"


def test_df_sanitization():
    test_player_data = {
        "round_start_time": ["4/23/2021 21:10", "4/23/2021 21:10", "4/23/2021 21:10"],
        "match_id": [37225, 37225, 37225],
        "player": ["blasé", "blasé", "blasé"],
        "team": ["London Spitfire", "London Spitfire", "London Spitfire"],
        "stat_name": ["All Damage Done", "Assists", "Average Time Alive"],
        "hero": ["Lúcio", "Lúcio", "Lúcio"],
        "stat_amount": [63965.21166, 12, 57.14750171]
    }

    test_match_data = {
        "match_id": [37234, 37232],
        "map_name": ["King's Row", "Watchpoint: Gibraltar"]
    }

    player_df = pd.DataFrame.from_dict(test_player_data)
    match_df = pd.DataFrame.from_dict(test_match_data)

    normalized_player_df = updater.dataframe_sanitize(player_df)
    normalized_match_df = updater.dataframe_sanitize(match_df)

    # print(player_df)
    # print(normalized_player_df)
    # print(match_df)
    print(normalized_match_df)

    # assert not normalized_player_df['player'].equals(player_df['player']), "Players column should not contain " \
    #                                                                        "UTF-8 characters"
    # assert not normalized_player_df['hero'].equals(player_df['hero']), "Heroes column should not contain UTF-8 " \
    #                                                                    "characters"
    assert normalized_match_df['map_name'].equals(match_df['map_name']), "King's Row and Watchpoint should be " \
                                                                         "reformatted to remove ' and :"


def test_generate_new_players(db_connection_class):
    db = db_connection_class
    raw_existing_players = db.select_query("*", "players_teams")

    test_player_data = {
        "round_start_time": ["6/23/2021 21:10", "6/23/2021 21:10", "6/23/2021 21:10", "6/23/2021 21:10"],
        "year": [2020, 2021, 2021, 2021],
        "match_id": [99999, 99999, 99999, 99999],
        "player": ["Anakin", "Anakin", "Yoda", "Doha"],
        "team": ["Jedi", "Sith", "Jedi", "Dallas Fuel"],
        "stat_name": ["All Damage Done", "Assists", "Average Time Alive", "Nothing"],
        "hero": ["Echo", "Echo", "Echo", "Echo"],
        "stat_amount": [63965.21166, 12, 57.14750171, 123]
    }
    player_df = pd.DataFrame.from_dict(test_player_data)
    filtered_new_players = updater.generate_new_players(player_df, raw_existing_players)

    for player in filtered_new_players:
        assert player not in raw_existing_players, "New players should not already exist"


def test_remove_columns():
    test_player_data = {
        "round_start_time": ["4/23/2021 21:10", "4/23/2021 21:10", "4/23/2021 21:10"],
        "year": [2021, 2021, 2021],
        "match_id": [37225, 37225, 37225],
        "player": ["blasé", "blasé", "blasé"],
        "team": ["London Spitfire", "London Spitfire", "London Spitfire"],
        "stat_name": ["All Damage Done", "Assists", "Average Time Alive"],
        "hero": ["Lúcio", "Lúcio", "Lúcio"],
        "stat_amount": [63965.21166, 12, 57.14750171]
    }
    player_df = pd.DataFrame.from_dict(test_player_data)
    columns_to_remove = ["round_start_time", "team"]

    new_player_df = updater.remove_columns(player_df, columns_to_remove)

    original_columns = list(player_df.columns)
    new_columns = list(new_player_df.columns)

    assert original_columns != new_columns


if __name__ == "__main__":
    print(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
