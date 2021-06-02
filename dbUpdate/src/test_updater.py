import os
import pandas as pd


def test_csv_files_present_in_parent_dir():
    """Matches and players CSV files are present"""
    assert os.path.isfile(f'{os.getcwd()}\\matches.csv')
    assert os.path.isfile(f'{os.getcwd()}\\players.csv')


def test_csv_files_contain_required_columns():
    """Required columns are present in matches.csv"""
    # matches.csv
    matches = pd.read_csv(f'{os.getcwd()}\\matches.csv')
    existing_columns = list(matches.columns)
    required_columns = ['round_start_time', 'round_end_time', 'year', 'stage', 'playoffs', 'postseason', 'match_id',
                        'game_number', 'match_winner', 'map_winner', 'map_loser', 'map_name', 'map_type', 'map_round',
                        'winning_team_final_map_score', 'losing_team_final_map_score', 'control_round_name', 'attacker',
                        'defender', 'attacker_payload_distance', 'defender_payload_distance', 'attacker_time_banked',
                        'defender_time_banked', 'attacker_control_perecent', 'defender_control_perecent', # these are
                        # typos from the original OWL data...
                        'attacker_round_end_score', 'defender_round_end_score']
    for column_name in required_columns:
        assert column_name in existing_columns

    # players.csv
    players = pd.read_csv(f'{os.getcwd()}\\players.csv')
    existing_columns = list(players.columns)
    required_columns = ['start_time', 'match_id', 'player', 'team_name', 'stat_name', 'hero', 'stat_amount']

    for column_name in required_columns:
        assert column_name in existing_columns

